var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// --- Parameters ---

var showStats = true;
var scale = 1;

// Boids
var boidSize = 15 * scale; // 20
var boidAngle = 0.2 * Math.PI;
var boidViewingAngle = 0.8 * Math.PI; // 0.8
var boidViewingDist = 100*scale;
var boidMaxTurn = 0.05*1/scale; // 0.05
var boidMaxSpeed = 1*scale; // 0.5

// Margins for the wall-looparound
var marg = 10;

// --- Init. variables ---
var mouseX = 0;
var mouseY = 0;
var boids = [];
var walls = [];


// --- Code ---

// Track mouse
canvas.onmousemove = function(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
};


function drawBoids() {
	for (var i = 0; i < boids.length; i++) {
		var boid = boids[i];

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
		ctx.fillStyle = (i == 0 && showStats == true) ? "red" : "black";
		ctx.fill();
	}
}

function drawWalls() {
	for (var i = 0; i < walls.length; i++) {
		var w = walls[i];
		
		ctx.beginPath();
		ctx.moveTo(w[0], w[1]);
		ctx.lineTo(w[2], w[3]);
		ctx.stroke();
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

/*	returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
	https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function 
*/
 function intersects(a,b,c,d,p,q,r,s) {
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};

function drawNeighbors(boid, neighbors) {
	for (var i = 0; i < neighbors.length; i++) {
		var neigh = neighbors[i];
		ctx.beginPath();
		ctx.moveTo(boid.x, boid.y);
		ctx.lineTo(neigh.x, neigh.y);
		ctx.stroke();
	}
}

function createWall(x1,y1,x2,y2) {
	walls.push([x1,y1,x2,y2]);
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

function collision(b) {

	for (var i = 0; i < 75; i++) {
		var angle = b.angle + Math.PI * 0.01 * i * (i % 2 == 0 ? 1 : -1); 
		angle = normalizeRad(angle)
		var x2 = b.x + Math.cos(angle)*boidViewingDist;
		var y2 = b.y - Math.sin(angle)*boidViewingDist;

		var collisionDetected = false;

		for (var j = 0; j < walls.length; j++) {
			var w = walls[j];
			if(intersects(w[0],w[1],w[2],w[3],b.x,b.y,x2,y2) == true) {
				collisionDetected = true;
				break;
			}
		}
		if(!collisionDetected && i == 0) {
			return [0,0];
		}

		

		if(!collisionDetected) {
			// Draw selected ray
			/*
			ctx.beginPath();
			ctx.moveTo(b.x,b.y);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			*/
			var diffangle = normalizeRad(angle - b.angle);
			return [diffangle,1];
		}
		
	}

	return [0,0];
}

function drawStats(col,sep,ali,coh) {
	var sum = 0;
	var temp = [col,sep,ali,coh]
	var result = [0,0,0,0];
	for(var i = 0; i < temp.length; i++) {
		temp[i] = temp[i] > 1 ? 1 : temp[i];

		if(sum + temp[i] >= 1) {
			result[i] = 1 - sum;
			sum = 1;
			break;
		}

		result[i] = temp[i];
		sum += temp[i];
	}

	var barWidth = 80;
	var colors = ["#000000", "#e6ac00", "#4dff4d","#0033cc"];
	var barHeightMax = 120;

	// Draw bars
	for(var i = 0; i < result.length; i++) {
		var barHeight = barHeightMax * result[i];

		ctx.beginPath();
		ctx.fillStyle = colors[i];
		ctx.fillRect(canvas.width-barWidth*(result.length-i), canvas.height-barHeight, barWidth, barHeight);
		ctx.stroke();
	}

	ctx.font = "15px Arial";
	ctx.fillStyle = "black";
	ctx.fillText("Col", canvas.width-barWidth*3.7, canvas.height-barHeightMax-10);
	ctx.fillText("Sep", canvas.width-barWidth*2.7, canvas.height-barHeightMax-10);
	ctx.fillText("Ali", canvas.width-barWidth*1.7, canvas.height-barHeightMax-10);
	ctx.fillText("Coh", canvas.width-barWidth*0.7, canvas.height-barHeightMax-10);
	ctx.fillText(Math.round(sum * 100) / 100, canvas.width-barWidth*4.5, canvas.height-barHeightMax/2);
	

	// Draw UI border
	ctx.beginPath()
	ctx.rect(canvas.width-barWidth*result.length, canvas.height-barHeightMax, barWidth*result.length,barHeightMax);
	ctx.stroke();

	return result;
}

function updateBoids() {
	for (var i = 0; i < boids.length; i++) {
		var b = boids[i];
		
		wallLoop(b);
		
		var neigh = detectNeighbors(b);

		//drawNeighbors(b,neigh);

		var col = collision(b);
		var sep = separation(b, neigh);
		var ali = alignment(b, neigh);
		var coh = cohesion(b, neigh);

		// Draw UI for the first boid and how it is effected by the rules
		if (i == 0 && showStats) drawStats(col[1],sep[1],ali[1],coh[1]);
		
		var rules = [col,sep,ali,coh];
		var accumilator = 0;
		var angleSum = 0;
		// Calculate the accumilated angle from the three+one rules
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
	drawWalls();
}

// --- SPAWN BOIDS ---
// Spawn random boids
for (var i = 0; i < 150; i++) {
	boids.push(new Boid(Math.random() * canvas.width, 
						Math.random() * canvas.height,
						Math.random() * Math.PI * 2))
}

// --- SPAWN WALLS ----
// Wall cage
/*
createWall(300,300,500,100);
createWall(500,100,700,100);
createWall(700,100,900,500);
createWall(900,500,500,800);
createWall(500,800,300,300);
*/


// Wall box
/*
createWall(300,300,300,500);
createWall(300,500,500,500);
createWall(500,500,500,300);
createWall(500,300,300,300);
*/

// Wall at edges
/*
createWall(0,0,canvas.width,0);
createWall(canvas.width,0,canvas.width,canvas.height);
createWall(canvas.width,canvas.height,0,canvas.height);
createWall(0,canvas.height,0,0);
*/

// Random walls

for (var i = 0; i < 10; i++) {
	var xDiff = Math.random() * 300 * (Math.random() > 0.5 ? 1:-1);
	var yDiff = Math.random() * 300 * (Math.random() > 0.5 ? 1:-1);
	var x = Math.random() * canvas.width;
	var y = Math.random() * canvas.height;
	createWall(x,y,x+xDiff,y+yDiff);
}


// --- Start simulation ---
var iId = setInterval(draw,10);
