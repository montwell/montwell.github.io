var geojson;
var covidDataByTown;
var mapColorScale;
var previouslySelectedTownId = null;
var previouslySelectedTown = null;

async function init() {
	console.log("version 0.03.200731");
	
	geojson = await d3.json("data/ct-towns.geojson");
	var csvCovidData = await d3.csv("data/covid-by-town.csv");	
	//console.log(csvCovidData);
	
	var maxCases = d3.max(csvCovidData, d => parseInt(d["Total cases "]));
	//console.log("Max Total Cases: " + maxCases);
	
	mapColorScale = d3.scaleLinear()
		.domain([0,maxCases])
		.range(["gainsboro","red"]);
	
	covidDataByTown = d3.nest()
		.key(d => d["Town number"])
		.sortKeys((a,b) => parseInt(a) - parseInt(b))
		.key(d => d["Last update date"])
		.sortKeys((a,b) => new Date(a) < new Date(b))
		.entries(csvCovidData);
	
	//console.log(covidDataByTown);
	drawMap();
	//drawCasesGraph(null);
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
	  
	var g = svg.append("g").attr("class", "g-town");
	
	var town = g.selectAll("path")
	  .data(geojson.features)
	  .enter()
	  .append("path")
	  .attr("class", "town")
	  .attr('d', path)
	  .style('fill', d => mapColorScale(getLatestData(d.properties.town_no)["Total cases "]))
	  .style('stroke', "white")	  
	  .on("mouseover", function(d) {onMouseOverTown(d3.select(this), d.properties.town_no);})
	  .on("mouseout", function(d) {onMouseOutTown(d3.select(this), d.properties.town_no);})
	  .on("click", function(d) {onClickTown(d3.select(this), d.properties.town_no);});
}

function drawCasesGraph(townId){
	var width = 425;
	var height = 300;
	
	if(townId != null) {
		var townData = covidDataByTown[townId - 1]
		console.log(townData)
		
		var svg = d3.select("#casesGraph")
			.append("svg")
			.attr('width', width)
			.attr('height', height);
			
		var g = svg.append("g").attr("class", "g-graph");
		
		var x = d3.scaleTime()
			.domain(d3.extent(townData.values, d => new Date(d.key)))
			.range([0, width]);
		
		svg.append("g").attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));
	}
}

function onMouseOverTown(path, townId) {
	path.transition(getEaseLinearTransition()).style('fill', "#00f");
	
	setTownInfo(townId);
}

function onMouseOutTown(path, townId) {	  
    if(previouslySelectedTownId != townId) {
		path.transition(getEaseLinearTransition())
			.style('fill', d => mapColorScale(getLatestData(townId)["Total cases "]))
	}
	
	if(previouslySelectedTownId != null) {
		setTownInfo(previouslySelectedTownId);
	} else {
		clearTownInfo();
	}
}  

function onClickTown(path, townId) {		
	
	if(previouslySelectedTownId != null) {
		var latestData = getLatestData(previouslySelectedTownId);
		previouslySelectedTown
			.style('fill', d => mapColorScale(getLatestData(previouslySelectedTownId)["Total cases "]))
	}
	
	if(previouslySelectedTownId != townId) {
		previouslySelectedTownId = townId;
		previouslySelectedTown = path;
		path.style('fill', '#00f');
	} else {
		previouslySelectedTownId = null;
		previouslySelectedTown = null;
	}
	
	drawCasesGraph(townId);
}

function getEaseLinearTransition() {
	return d3.transition()
      .duration(400)
      .ease(d3.easeLinear);
}

function setTownInfo(townId) {
	var latestData = getLatestData(townId)
	
	document.getElementById("townInfo").innerHTML = 
		'<div id="townInfoName">' + latestData.Town + '</div>'
		+ '<div class="townInfoDetails">Total Cases: ' + latestData["Total cases "] + '</div>'
		+ '<div class="townInfoDetails">Total Deaths: ' + latestData["Total deaths"] + '</div>';
}

function clearTownInfo() {
	document.getElementById("townInfo").innerHTML = ""
}

function getLatestData(townId) {
	var townData = covidDataByTown[townId - 1]
	//console.log(townData)
	var latestData = townData.values[townData.values.length - 1]
	//console.log(latestData)
	return latestData.values[0];
}

function getTownName(townId) {
	var townData = covidDataByTown[townId - 1]
	//console.log(townData)
	var latestData = townData.values[townData.values.length - 1]
	//console.log(latestData)
	return latestData.values[0].Town;
}

