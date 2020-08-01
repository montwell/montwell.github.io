async function loadMap() {
	
	var width = 1400;
	var height = 700;
	var townMap = await d3.json("data/ct-towns.geojson");
	var projection = d3.geoMercator().translate([width/2, height/2]).scale(2000).center([42,-72]);
    var path = d3.geoPath().projection(projection);
	
	var svg = d3.select("#map")
	  .append("svg")
	  .attr('width', width)
	  .attr('height', height);
	  
	var g = svg.append("g").attr("class", "g-town")
	
	var town = g.selectAll("path")
	  .data(townMap.features)
	  .enter()
	  .append("path")
	  .attr("class", "town")
	  .attr('d', path)
	  .style('stroke', "black");	
}