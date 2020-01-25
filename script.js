var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// --- Parameters ---
// * Boids
var boidSize = 15; // 20
var boidAngle = 0.2 * Math.PI;
var boidViewingAngle = 0.8 * Math.PI; // 0.8
var boidViewingDist = 100;
var boidMaxTurn = 0.05; // 0.05
var boidMaxSpeed = 0.75; // 0.5

// Margins for the wall-loop
var marg = 10;

// --- Init. variables ---
var mouseX = 0;
var mouseY = 0;
var boids = [];


// --- Code ---

// Track mouse
canvas.onmousemove = function(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
};

function drawBoid(boid) {
	var x = boid.x;
	var y = boid.y;
	var angle = boid.angle;

	var x1 = x + (boidSize / 2) * Math.cos(angle);
	var y1 = y - (boidSize / 2) * Math.sin(angle);
	
	var toBackLength = Math.sqrt(Math.pow(Math.tan(boidAngle/2)*boidSize,2) + Math.pow(boidSize/2,2));

	var x2 = x + toBackLength * Math.cos(Math.PI - (boidAngle - angle));
	var y2 = y - toBackLength * Math.sin(Math.PI - (boidAngle - angle));

	var x3 = x - (boidSize / 4) * Math.cos(angle);
	var y3 = y + (boidSize / 4) * Math.sin(angle);

	var x4 = x + toBackLength * Math.cos(Math.PI + (boidAngle + angle));
	var y4 = y - toBackLength * Math.sin(Math.PI + (boidAngle + angle));
	

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx.lineTo(x4, y4);
	ctx.closePath();
	ctx.fillStyle = "black";
	ctx.fill();

}

function drawBoids() {
	for (var i = 0; i < boids.length; i++) {
		var b = boids[i];
		drawBoid(b);
	}
}

function wallLoop(b) {
	if (b.x > canvas.width + marg) {
		b.x = -marg;
	}
	if (b.x < -marg) {
		b.x = canvas.width + marg;
	}
	if (b.y > canvas.height + marg) {
		b.y = -marg;
	}
	if (b.y < -marg) {
		b.y = canvas.height+marg;
	}
}

function normalizeRad(angle) {
	if (angle > Math.PI) {
		return angle - 2 * Math.PI
	}
	if (angle < -Math.PI) {
		return angle + 2 * Math.PI
	}
	return angle;
}

function detectNeighbors(boid) {
	var neighbors = [];
	for (var i = 0; i < boids.length; i++) {
		var b1 = boid;
		var b2 = boids[i];
		if(b1 == b2) {
			continue
		}
		
		if (Math.sqrt( Math.pow(b1.x-b2.x,2) + Math.pow(b1.y-b2.y,2) ) < boidViewingDist &&
			Math.abs(normalizeRad(-Math.atan2(b2.y - b1.y, b2.x - b1.x) - b1.angle)) < boidViewingAngle) {
			neighbors.push(b2);
		}
		
	}
	return neighbors;
}

function drawNeighbors(boid, neighbors) {
	for (var i = 0; i < neighbors.length; i++) {
		var neigh = neighbors[i];
		ctx.beginPath();
		ctx.moveTo(boid.x, boid.y);
		ctx.lineTo(neigh.x, neigh.y);
		ctx.stroke();
	}
}

function separation(boid, neighbors) {
	if (neighbors.length == 0) return [0,0];
	
	var x = 0;
	var y = 0;
	neighbors.forEach(elem => {
		var angle = Math.atan2(-elem.y + boid.y,elem.x - boid.x);
		var dist = Math.sqrt(Math.pow(elem.x - boid.x,2) + Math.pow(elem.y - boid.y,2));
		x -= Math.cos(angle) * (boidViewingDist - dist) / boidViewingDist;
		y += Math.sin(angle) * (boidViewingDist - dist) / boidViewingDist;
	})
	
	var angle = -normalizeRad(boid.angle - Math.atan2(-y,x)) * 0.05;
	var dist = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
	var weight = dist > 1 ? 1 : dist;
	
	ctx.fill();
	ctx.stroke();

	return [angle, weight];
}

function alignment(boid, neighbors) {
	if (neighbors.length == 0) return [0,0];

	var angleSum = 0;
	neighbors.forEach(elem => {
		var angle = elem.angle;
		if(elem.angle < 0) angle = elem.angle + 2*Math.PI;
		angleSum += angle;
	})
	var averageAngle = normalizeRad(angleSum / neighbors.length);
	var diffAngle = normalizeRad(boid.angle - averageAngle);
	var weight = Math.abs(diffAngle) > 0.2 * Math.PI ? 1 : Math.abs(diffAngle) / (0.2 * Math.PI); 
	return [-diffAngle, weight];
}

function cohesion(boid, neighbors) {
	if (neighbors.length == 0) return [0,0];

	var nXCords = [];
	var nYCords = [];
	for (var i = 0; i < neighbors.length; i++) {
		var n = neighbors[i];
		nXCords.push(n.x);
		nYCords.push(n.y);
	}
	// Get average position of neighbors
	var x = nXCords.reduce((a, b) => a + b, 0) / nXCords.length;
	var y = nYCords.reduce((a, b) => a + b, 0) / nYCords.length;
	
	var angle = normalizeRad(-Math.atan2(y - boid.y, x - boid.x) - boid.angle)
	var weight = Math.abs(angle) / boidViewingAngle;
	return [angle,weight];
}

function updateBoids() {
	for (var i = 0; i < boids.length; i++) {
		var b = boids[i];
		
		wallLoop(b);
		
		var turnAmount = 0;
		var neigh = detectNeighbors(b);

		//drawNeighbors(b,neigh);

		var sep = separation(b, neigh);
		var ali = alignment(b, neigh);
		var coh = cohesion(b, neigh);

		var rules = [sep,ali,coh];
		var accumilator = 0;
		var angleSum = 0;
		// Calculate the accumilated angle from the three rules
		for (var j = 0; j < rules.length; j++) {
			var angle = rules[j][0];
			var weight = rules[j][1];
			
			// Trim weight if accumilator gets full, also prepare to break.
			if (accumilator + weight >= 1) {
				weight = 1 - accumilator;
				accumilator += weight;
			} else {
				accumilator += weight;
			}
			
			if(weight != 0) angleSum +=  (angle - angleSum) * weight;

			if (accumilator > 1) break;
		}

		if (angleSum > boidMaxTurn) angleSum = boidMaxTurn;
		if (angleSum < -boidMaxTurn) angleSum = -boidMaxTurn;
		
		b.angle += angleSum;
		b.angle = normalizeRad(b.angle);

		b.x += boidMaxSpeed * Math.cos(b.angle);
		b.y -= boidMaxSpeed * Math.sin(b.angle);
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	updateBoids();
	drawBoids();
}


for (var i = 0; i < 100; i++) {
	boids.push(new Boid(Math.random() * canvas.width, Math.random() * canvas.height
						, Math.random() * Math.PI * 2))
}

var iId = setInterval(draw,10);