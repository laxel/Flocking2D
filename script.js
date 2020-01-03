var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var boidLength = 40;
var boidAngle = 0.2 * Math.PI;

var mouseX = 0;
var mouseY = 0;

var walls = [{x:100, y:50}];
var boids = [new Boid(200,100,Math.PI*0.2)];
var wallRadius = 5;

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

function drawBoid(x,y,angle) {
	
	angle = -Math.atan2(mouseY - y, mouseX - x);
	console.log(angle);

	var x1 = x + (boidLength / 2) * Math.cos(angle);
	var y1 = y - (boidLength / 2) * Math.sin(angle);
	
	var toBackLength = Math.sqrt(Math.pow(Math.tan(boidAngle/2)*boidLength,2) + Math.pow(boidLength/2,2));

	var x2 = x + toBackLength * Math.cos(Math.PI - (boidAngle - angle));
	var y2 = y - toBackLength * Math.sin(Math.PI - (boidAngle - angle));

	var x3 = x + toBackLength * Math.cos(Math.PI + (boidAngle + angle));
	var y3 = y - toBackLength * Math.sin(Math.PI + (boidAngle + angle));

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx.closePath();
	ctx.fillStyle = "black";
	ctx.fill();

}

function drawBoids() {
	for (i = 0; i < boids.length; i++) {
		var b = boids[i];
		drawBoid(b.x,b.y, b.angle);
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawWalls();
	drawBoids();
	
}


setInterval(draw,10);












