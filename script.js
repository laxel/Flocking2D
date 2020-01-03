var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// --- Parameters ---
// * Boids
var boidSize = 20;
var boidAngle = 0.2 * Math.PI;
var boidViewingAngle = 0.75 * Math.PI;
var boidViewingDist = 100;
var boidMaxTurn = 0.05;
var boidMaxSpeed = 0.5;

var marg = 10;
// * Wall
var wallRadius = 5;


// --- Init. variables ---
var mouseX = 0;
var mouseY = 0;
var walls = [{x:100, y:50}];
var boids = [];


// --- Code ---

// Track mouse
canvas.onmousemove = function(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
};


function drawWalls() {
	for (i = 0; i < walls.length; i++) {
		var w = walls[i]
		ctx.beginPath();
		ctx.arc(w.x,w.y, wallRadius,0,Math.PI*2);
		ctx.fillStyle = "red";
		ctx.fill();
		ctx.closePath();
	}
}

function drawBoid(boid) {
	var x = boid.x;
	var y = boid.y;
	var angle = boid.angle;
	
	//angle = -Math.atan2(mouseY - y, mouseX - x);
	//boid.angle = angle;

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

function detectNeighbors(boid) {
	var neighbors = [];
	for (var i = 0; i < boids.length; i++) {
		var b1 = boid;
		var b2 = boids[i];
		if(b1 == b2) {
			continue
		}
		
		// TODO add angle
		if (Math.sqrt( Math.pow(b1.x-b2.x,2) + Math.pow(b1.y-b2.y,2) ) < boidViewingDist) {
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

function updateBoids() {
	for (var i = 0; i < boids.length; i++) {
		var b = boids[i];
		
		wallLoop(b);
		
		var turnAmount = 0;
		var neigh = detectNeighbors(b);
		drawNeighbors(b,neigh);
		//separation(b);
		//alignment(b);
		//cohesion(b);
		
		if (turnAmount > boidMaxTurn) turnAmount = boidMaxTurn;
		if (turnAmount < -boidMaxTurn) turnAmount = -boidMaxTurn;
		
		b.angle += turnAmount;

		b.x = b.x + boidMaxSpeed * Math.cos(b.angle);
		b.y = b.y - boidMaxSpeed * Math.sin(b.angle);
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	updateBoids();
	//drawWalls();
	drawBoids();
}

for (var i = 0; i < 50; i++) {
	boids.push(new Boid(Math.random() * canvas.width, Math.random() * canvas.height
						, Math.random() * Math.PI * 2))
}

var iId = setInterval(draw,10);












