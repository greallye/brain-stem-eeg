var shiftrUrl = 'your shiftr url';

// Connect to MQTT on shiftr.io
var client = mqtt.connect(shiftrUrl, {
    clientId: 'tree reciever'
});

//Subscribe to attention reading from NodeMCU board
client.on('connect', function() {
    client.subscribe('/attention');
});

// Brain Stems Configuration
var stems = [];
var brainStem = {i: 0, x: 370, y: 600, a: 0, l: 130, d:0}; // a = angle, l = length, d = depth
var stemSplit = 0.5; // Angle delta
var stemLength = 0.8; // Length delta (factor)
var craziness = 0.7; 
var complexity = 8;//complexity anything over 10 will load slowler.


function branch(b) {
	var end = endPt(b), daR, newB;

	stems.push(b);

	if (b.d === complexity)
		return;

	// Left branch
	daR = craziness * Math.random() - craziness * 0.5;
	newB = {
		i: stems.length,
		x: end.x,
		y: end.y,
		a: b.a - stemSplit + daR,
		l: b.l * stemLength,
		d: b.d + 1,
		parent: b.i
	};
	branch(newB);

	// Right branch
	daR = craziness * Math.random() - craziness * 0.5;
	newB = {
		i: stems.length,
		x: end.x, 
		y: end.y, 
		a: b.a + stemSplit + daR, 
		l: b.l * stemLength, 
		d: b.d + 1,
		parent: b.i
	};
	branch(newB);
}


function regenerate(initialise) {
	stems = [];
	branch(brainStem);
	initialise ? create() : update();
}

function endPt(b) {
	// Return endpoint of stem
	var x = b.x + b.l * Math.sin( b.a );
	var y = b.y - b.l * Math.cos( b.a );
	return {x: x, y: y};
}


// D3 functions
function x1(d) {return d.x;}
function y1(d) {return d.y;}
function x2(d) {return endPt(d).x;}
function y2(d) {return endPt(d).y;}



function create() {
	d3.select('svg')
		.selectAll('line')
		.data(stems)
		.enter()
		.append('line')
		.attr('x1', x1)
		.attr('y1', y1)
		.attr('x2', x2)
		.attr('y2', y2)
		.style('stroke-width', function(d) {return parseInt(complexity + 1 - d.d) + 'px';})
		.attr('id', function(d) {return 'id-'+d.i;})
		.style("filter", "url(#glow)");		
}

var svg = d3.select("svg");
var defs = svg.append("svg");

//Set the stems to glow
var filter = defs.append("filter")
	.attr("id","glow");
filter.append("feGaussianBlur")
	.attr("stdDeviation","0")
	.attr("result","coloredBlur");
var feMerge = filter.append("feMerge");
feMerge.append("feMergeNode")
	.attr("in","coloredBlur");
feMerge.append("feMergeNode")
	.attr("in","SourceGraphic");

function update() {
	d3.select('svg')
		.selectAll('line')
		.data(stems)
		.transition()
		.attr('x1', x1)
		.attr('y1', y1)
		.attr('x2', x2)
		.attr('y2', y2);
}

//When a message is recieved from the headset which will be every second a new 
client.on('message', function(topic, message) {
	if(topic == '/attention'){
        $("#activity").html(message.toString());
        document.getElementById('activity').value = message.toString();
    }
    regenerate(false);
    var thisNumber = parseInt(message.toString());
    brainStem.l = thisNumber+30;
});

regenerate(true);