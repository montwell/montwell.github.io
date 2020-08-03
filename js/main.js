var geojson;
var covidDataByTown;
var mapColorScale;
var previouslySelectedTownId = null;
var previouslySelectedTown = null;

var turningPoints = [
	{"date":"03/26/2020","text":"The total number of confirmed COVID-19 infections in Connecticut reach 1,000. Lamont limits gatherings to five people"},
	{"date":"04/17/2020","text":"Deaths from the coronavirus in Connecticut reach 1,000. Lamont signs executive order mandating face coverings in public."},
	{"date":"05/20/2020","text":"Gov. Lamont's stay-at-home order is lifted, Connecticut begins phase 1 of a three-phase plan to reopen."},
	{"date":"06/17/2020","text":"Phase 2 begins. Indoor dining, hotels and gyms are allowed to open."}
	{"date":"07/06/2020","text":"Lamont suspends Phase 3 reopening for bars and public gatherings as cases surge nationally."}
	];

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
	var height = 650;	
	var projection = d3.geoMercator().translate([width/2, height/2]).scale(25000).center([-72.7, 41.55]);
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
	  .style('cursor', 'pointer')	  
	  .on("mouseover", function(d) {onMouseOverTown(d3.select(this), d.properties.town_no);})
	  .on("mouseout", function(d) {onMouseOutTown(d3.select(this), d.properties.town_no);})
	  .on("click", function(d) {onClickTown(d3.select(this), d.properties.town_no);});
}

function drawCasesGraph(townId){	
	var svgWidth = 425;
	var svgHeight = 300;
	
	var margin = {top: 60, right: 30, bottom: 30, left: 60},
		gWidth = svgWidth - margin.left - margin.right,
		gHeight = svgHeight - margin.top - margin.bottom;
	
	if(townId != null) {		
		var townData = covidDataByTown[townId - 1].values
		console.log(townData)
		var maxCases = d3.max(townData.values, d => d.values[0]["Total cases "])
		console.log("Max Cases: " + maxCases);					
		
		var casesGraphDiv = d3.select("#casesGraph");
		casesGraphDiv.selectAll("svg").remove();
		
		var svg = casesGraphDiv
			.append("svg")
			.attr('width', svgWidth)
			.attr('height', svgHeight);
			
		var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "g-graph");
		
		var x = d3.scaleTime()
			.domain(d3.extent(townData, d => new Date(d.key)))
			.range([0, gWidth]);
			
		var y = d3.scaleLinear()
			.domain([0, d3.max(townData, d => parseInt(d.values[0]["Total cases "]))])
			.range([gHeight, 0]);			
			
		var tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0);
		
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (gHeight + margin.top) + ")")
			.call(d3.axisBottom(x).ticks(5));
			
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.call(d3.axisLeft(y));
			
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")			
			.selectAll('circle')
			.data(turningPoints)
			.enter()
			.append('circle')
			.attr('r', 10)
			.attr('cx', d => x(new Date(d.date)))
			.attr('cy', d => y(getCasesFromDate(townData, d.date)))
			.attr('stroke-width', '5px')
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(255,255,0,.8)')
			.style('cursor', 'pointer')
			.on('click', d => {
				console.log(d.text);
			});	
			
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")			
			.append("path")
			.datum(townData)
			.attr("fill", "none")
			.attr("stroke", "#00f")
			.attr("stroke-width", 1.5)
			.attr("d", d3.line()
				.x(d => x(new Date(d.key)))
				.y(d => y(parseInt(d.values[0]["Total cases "]))));
				
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")			
			.selectAll('circle')
			.data(townData)
			.enter()
			.append('circle')
			.attr('r', 3)
			.attr('cx', d => x(new Date(d.key)))
			.attr('cy', d => y(parseInt(d.values[0]["Total cases "])))
			.attr('stroke-width', '5px')
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)')
			.on('mouseover', d => {
			  tooltip
				.transition()
				.duration(200)
				.style('opacity', 0.9);
			  tooltip
				.html(d.key + '<br/>' + d.values[0]["Total cases "])
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY + 20 + 'px');
			})
			.on('mouseout', () => {
			  tooltip
				.transition()
				.duration(500)
				.style('opacity', 0);
			});		
	}
}

function getCasesFromDate(townData, date) {
	console.log("looking for " + date);
	for(i = 0; i < townData.length; i++) {
		if(townData[i].key) {
			console.log("Found at " + i);
			console.log("Total cases " + townData[0].values[0]["Total cases "]);
			return townData[0].values[0]["Total cases "];
		}
	}
}

function drawDeathsGraph(townId){	
	var svgWidth = 425;
	var svgHeight = 300;
	
	var margin = {top: 60, right: 30, bottom: 30, left: 60},
		gWidth = svgWidth - margin.left - margin.right,
		gHeight = svgHeight - margin.top - margin.bottom;
	
	if(townId != null) {
		var townData = covidDataByTown[townId - 1].values
		console.log(townData)
		var maxCases = d3.max(townData.values, d => d.values[0]["Total deaths"])
		console.log("Max Cases: " + maxCases);					
		
		var deathsGraphDiv = d3.select("#deathsGraph");		
		deathsGraphDiv.selectAll("svg").remove();
		
		var svg = deathsGraphDiv
			.append("svg")
			.attr('width', svgWidth)
			.attr('height', svgHeight);
			
		var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "g-graph");
		
		var x = d3.scaleTime()
			.domain(d3.extent(townData, d => new Date(d.key)))
			.range([0, gWidth]);
			
		var y = d3.scaleLinear()
			.domain([0, d3.max(townData, d => parseInt(d.values[0]["Total deaths"]))])
			.range([gHeight, 0]);

		var tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0);			
		
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (gHeight + margin.top) + ")")
			.call(d3.axisBottom(x).ticks(5));
			
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.call(d3.axisLeft(y));
			
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")			
			.append("path")
			.datum(townData)
			.attr("fill", "none")
			.attr("stroke", "#00f")
			.attr("stroke-width", 1.5)
			.attr("d", d3.line()
				.x(d => x(new Date(d.key)))
				.y(d => y(parseInt(d.values[0]["Total deaths"]))));
				
		svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")			
			.selectAll('circle')
			.data(townData)
			.enter()
			.append('circle')
			.attr('r', 3)
			.attr('cx', d => x(new Date(d.key)))
			.attr('cy', d => y(parseInt(d.values[0]["Total deaths"])))
			.attr('stroke-width', '5px')
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)')
			.on('mouseover', d => {
			  tooltip
				.transition()
				.duration(200)
				.style('opacity', 0.9);
			  tooltip
				.html(d.key + '<br/>' + d.values[0]["Total deaths"])
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY + 20 + 'px');
			})
			.on('mouseout', () => {
			  tooltip
				.transition()
				.duration(500)
				.style('opacity', 0);
			});
	}
}

function onMouseOverTown(path, townId) {
	path.transition(getEaseLinearTransition(400)).style('fill', "#00f");
	
	setTownInfo(townId);
}

function onMouseOutTown(path, townId) {	  
    if(previouslySelectedTownId != townId) {
		path.transition(getEaseLinearTransition(400))
			.style('fill', d => mapColorScale(getLatestData(townId)["Total cases "]))
	}
	
	if(previouslySelectedTownId != null) {
		setTownInfo(previouslySelectedTownId);
	} else {
		clearTownInfo();
	}
}  

async function onClickTown(path, townId) {		
	
	if(previouslySelectedTownId != null) {
		var latestData = getLatestData(previouslySelectedTownId);
		previouslySelectedTown
			.style('fill', d => mapColorScale(getLatestData(previouslySelectedTownId)["Total cases "]))
	}
	
	if(previouslySelectedTownId != townId) {
		previouslySelectedTownId = townId;
		previouslySelectedTown = path;
		path.style('fill', '#00f');
		d3.select("#graphHelp").transition().duration(400).style('opacity', 0);
		await d3.select("#graphs").transition().duration(400).style('opacity', 0).end();
		drawCasesGraph(townId);
		drawDeathsGraph(townId);
		d3.select("#graphs").transition().duration(800).style('opacity', 1);
		
	} else {
		console.log("Town unclicked");
		previouslySelectedTownId = null;
		previouslySelectedTown = null;
		await d3.select("#graphs").transition().duration(800).style('opacity', 0).end();
		d3.select("#graphHelp").transition().duration(400).style('opacity', 1);
	}
}

function getEaseLinearTransition(duration) {
	return d3.transition()
      .duration(duration)
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

