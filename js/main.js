function loadMap() {
	
	var width = 1400;
	var height = 7000;
	var townMap = d3.json("data/ct-towns.geojson");
	var projection = d3.geoMercator().translate([width/2, height/2]).scale(2200).center([0,40]);
    var path = d3.geoPath().projection(projection);
	
	svg = d3.select("#map")
	  .append("svg")
	  .attr('width', width)
	  .attr('height', height);
	  
	g = svg.append("g").attr("class", "g-town")
	
	town = g.selectAll("path.town")
	  .data(geojson.features)
	  .enter()
	  .append("path")
	  .attr("class", "town")
	  .attr('d', path)
	  .style('stroke', "white");
	
}