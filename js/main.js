var geojson;
var covidData;

var transitionEaseLinear = d3.transition()
      .duration(400)
      .ease(d3.easeLinear);

async function init() {
	
	geojson = await d3.json("data/ct-towns.geojson");
	// load Covid Data
	
	drawMap();
}

function drawMap() {
	var width = 1000;
	var height = 700;	
	var projection = d3.geoMercator().translate([width/2, height/2]).scale(25000).center([-72.6, 41.5]);
    var path = d3.geoPath().projection(projection);
	
	var svg = d3.select("#map")
	  .append("svg")
	  .attr('width', width)
	  .attr('height', height);
	  
	var g = svg.append("g").attr("class", "g-town")
	
	var town = g.selectAll("path")
	  .data(geojson.features)
	  .enter()
	  .append("path")
	  .attr("class", "town")
	  .attr('d', path)
	  .style('stroke', "white")	  
	  .on("mouseover", function(d) {onMouseOverTown(d3.select(this), d.properties.town_no);})
	  .on("mouseout", function(d) {onMouseOutTown(d3.select(this), d.properties.town_no);})
	  .on("click", function(d) {onClickTown(d.properties.town_no);});
}

function onMouseOverTown(path, townId) {
	console.log("over town: " + townId);
	path.transition(transitionEaseLinear).style('fill', "#ff0000");
}

function onMouseOutTown(path, townId) {	  
	path.transition(transitionEaseLinear).style('fill', "#ccc");
}  

function onClickTown(path, townId) {
	console.log(townId + "Clicked!")
	path.style('stroke', '#f00')
}