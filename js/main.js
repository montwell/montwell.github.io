var geojson;
var covidDataByTown;
var clickedTown = "";

async function init() {
	console.log("version 0.03.200731");
	
	geojson = await d3.json("data/ct-towns.geojson");
	var csvCovidData = await d3.csv("data/covid-by-town.csv");
	
	covidDataByTown = d3.nest()
		.key(d => d["Town number"])
		.sortKeys((a,b) => parseInt(a) - parseInt(b))
		.key(d => d["Last update date"])
		.sortKeys((a,b) => new Date(a) < new Date(b))
		.entries(csvCovidData);
	
	console.log(covidDataByTown);
	drawMap();
}

function drawMap() {
	var width = 900;
	var height = 700;	
	var projection = d3.geoMercator().translate([width/2, height/2]).scale(25000).center([-72.7, 41.5]);
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
	  .on("click", function(d) {onClickTown(d3.select(this), d.properties.town_no);});
}

function onMouseOverTown(path, townId) {
	path.transition(getEaseLinearTransition()).style('fill', "#00f");
	
	setTownInfo(townId);
}

function onMouseOutTown(path, townId) {	  
    if(clickedTown != townId) {
		path.transition(getEaseLinearTransition()).style('fill', "#ccc");
	}
	
	if(clickedTown == "") {
		clearTownInfo();
	} else {
		setTownInfo(clickedTown);
	}
}  

function onClickTown(path, townId) {
	console.log(townId + " Clicked!");
	greyMap();
	if(clickedTown != townId) {
		clickedTown = townId;
		path.style('fill', '#00f');
	} else {
		clickedTown = "";
	}	
}

function getEaseLinearTransition() {
	return d3.transition()
      .duration(400)
      .ease(d3.easeLinear);
}

function greyMap() {
	d3.select("#map")
	  .select("svg")
	  .select("g")
	  .selectAll("path")
	  .style('fill', '#ccc');
}

function setTownInfo(townId) {
	document.getElementById("townInfo").innerHTML = 
		'<span id="townInfoName">' + getTownName(clickedTown) + '</span>';
}

function clearTownInfo() {
	document.getElementById("townInfo").innerHTML = ""
}

function getTownName(townId) {
	var townData = covidDataByTown[townId - 1]
	console.log(townData)
	var latestData = townData.values[townData.values.length - 1]
	console.log(latestData)
	return latestData.values[0].Town;
}

