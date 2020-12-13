// Zoomed heatmap setup
total_frames = 0;
player_count = 0;

zoomed_heatmap_size = 20;
first_half_zoomed_heatmap_size = 0;
last_half_zoomed_heatmap_size = 0;

zoomed_heatmap_left = 0;
zoomed_heatmap_right = 0;

zoomedHeatmapWidth = 0, zoomedHeatmapHeight = 0, zoomedGridWidth = 0, zoomedGridHeight = 0;

zoomed_heatmap_data_files = {};
update_count = 0;
main_timeline_handle_value = 0;

// Zoomed Timeline
zoomedTimelineHeight = 0, zoomedTimelineWidth = 0;
var zoomed_margin = {top: 0, bottom: 0, left: 0, right: 0};
var x = null, handle_value = 0;


// Replicate each zoomed timeframe row
function multiplyZoomedTimeframeNode(node, player_c, deep, player_names) {

  player_count = player_c;

  for (var i = 0, copy; i < player_count; i++) {
      copy = node.cloneNode(deep);
      node.parentNode.insertBefore(copy, node);

      node.style.display = "block";
      node.id = "zoomed_timeframe_heatmap_" + player_names[i];
  }
}

saveZoomedFiles = function(tsvFile, map_name) {

  // Read TSV File
  d3.tsv(tsvFile, function(d) {
    return {
      frame_no: +d.frame_no,
      value: +d.value
    };
  },

  function(error, data) {
     zoomed_heatmap_data_files[map_name] = data;
  });

};

// Draw Zoomed HeatMap for each player
function multiplyZoomedPlayerHeatmap(player_count, player_names, total_frames_val) {

  total_frames = total_frames_val;
  update_count = 0;

  zoomed_heatmap_size = 20;
  first_half_zoomed_heatmap_size = zoomed_heatmap_size/2;
  last_half_zoomed_heatmap_size = total_frames - first_half_zoomed_heatmap_size;

  // Find start frame number after offset and total frame
  zoomed_heatmap_left = 0
  zoomed_heatmap_right = zoomed_heatmap_size - 1;

  // Set width and height for heatmap
  zoomedHeatmapWidth = document.querySelector('#zooomed_heatmap_container').offsetWidth;

  zoomedTimelineHeight = document.querySelector('#zoomed_timeframe_timeline').getBoundingClientRect().height;
  if(player_count>=4)
    zoomedHeatmapHeight = zoomedTimelineHeight;
  else
    zoomedHeatmapHeight = (zoomedTimelineHeight*4)/player_count;

  // Set gridWidth and gridHeight for heatmap grids
  zoomedGridWidth = parseFloat(zoomedHeatmapWidth/zoomed_heatmap_size);
  zoomedGridHeight = zoomedHeatmapHeight*0.99;

  for (var i = 0; i < player_count; i++) {

      node = document.querySelector('#zoomed_timeframe_heatmap_'+player_names[i]);
      tsvFile = "generated_files\\player_"+player_names[i]+".tsv";
      node.style.height = zoomedHeatmapHeight+"px";
      node.value = player_names[i];

      if(i%2==0)
        saveZoomedFiles("generated_files\\gaze-distance_"+player_names[i]+"_"+player_names[i+1]+".tsv", "gaze-distance_"+player_names[i]+"_"+player_names[i+1]);

      // Draw player zoomed heatmap
      drawZoomedHeatmap(node.id, tsvFile, 'player', 'player_'+player_names[i], player_names[i]);
  }

  // // Display timeline below heatmap
  // svg_row_height = (node.getBoundingClientRect().height)*4;
  // setZoomedTimelineDimensions(heatmapWidth, ((svg_row_height/66.66)*15), gridWidth);

  // zoomed_timeline_height = (document.querySelector('#center_timeframe_layout').getBoundingClientRect().height)*0.12;
  setZoomedTimelineDimensions();

}

// Heatmap
var drawZoomedHeatmap = function(id, tsvFile, element, map_name, data_name) {

  // Remove previous heatmap svg's
  d3.select("#"+id).selectAll(".zoomed_heatmap_svg").remove();

  // Create new svg for heatmap
  var zoomed_svg = d3.select("#" + id).append("svg")
      .attr("class", "zoomed_heatmap_svg")
      .attr("width", zoomedHeatmapWidth)
      .attr("height", zoomedHeatmapHeight*1.0)
      .append("g")
        .attr("class", "zoomed_svg_g")
        .attr("width", zoomedHeatmapWidth)
        .attr("height", zoomedHeatmapHeight*1.0);

  // Read TSV File
  d3.tsv(tsvFile, function(d) {
    return {
      frame_no: +d.frame_no,
      value: +d.value
    };
  },

  function(error, data) {

    zoomed_heatmap_data_files[map_name] = data;
    data =  data.slice(zoomed_heatmap_left, zoomed_heatmap_right+1);

    var zoomed_cards = zoomed_svg.selectAll(".zoomed_frame_no")
        .data(data, function(d) { return d.frame_no; });

    zoomed_cards.enter()
      .append("rect")
        .attr("x", function(d) { return (d.frame_no * zoomedGridWidth); })
        .attr("class", "zoomed_grid")
        .attr("width", zoomedGridWidth)
        .attr("height", zoomedGridHeight)
        .style("fill", (d) => getColor(element, d.value))
      .append("title")
        .text( (d) => ("Data: " + data_name + "\nFrame #" + d.frame_no + "\n" + getTooltip(element, d.value)));

    zoomed_cards.exit().remove();

  });

};

var drawUpdatedZoomedHeatmap = function(id, element, map_name, curr_data_name) {

  data =  zoomed_heatmap_data_files[map_name].slice(zoomed_heatmap_left, zoomed_heatmap_right+1);

  var zoomed_svg = d3.select("#"+id).select('.zoomed_svg_g');

  // zoomed_svg_g.

  var zoomed_cards = zoomed_svg.selectAll(".zoomed_frame_no")
      .data(data, function(d) { return d.frame_no; });

  zoomed_cards.enter()
    .append("rect")
      .attr("x", function(d) { return ((d.frame_no-zoomed_heatmap_left) * zoomedGridWidth); })
      .attr("class", "zoomed_grid")
      .attr("width", zoomedGridWidth)
      .attr("height", zoomedGridHeight)
      .style("fill", (d) => getColor(element, d.value))
    .append("title")
      .text( (d) => ("Data: " + curr_data_name + "\nFrame #" + d.frame_no + "\n" + getTooltip(element, d.value)));

  zoomed_cards.exit().remove();

};

// Update visualization heatmap when dropdown value changes
function updateZoomedVisualizationHeatmap(handle_value) {
  update_count++;

  if(update_count==1)
    return;

  main_timeline_handle_value = handle_value;

  // Find l and r
  if(handle_value < first_half_zoomed_heatmap_size-1) {

  	zoomed_heatmap_left = 0;
  	zoomed_heatmap_right = zoomed_heatmap_size - 1;

  } else if(handle_value >= last_half_zoomed_heatmap_size) {

  	zoomed_heatmap_left = total_frames - zoomed_heatmap_size + 1;
  	zoomed_heatmap_right = total_frames - 1;

  } else {

  	zoomed_heatmap_left = handle_value - first_half_zoomed_heatmap_size + 1;
  	zoomed_heatmap_right = handle_value + first_half_zoomed_heatmap_size;

  }

  zoomed_heatmap_node = $('.zoomed_timeframe_heatmap');
  i = 1;

  // Update players
  for(; i<=player_count; i++) {

    node_id_split = zoomed_heatmap_node[i].id.split('_');

    // Player data
    element = "player";
    file_name = "player_" + node_id_split[3];
    data_name = zoomed_heatmap_node[i].value;

    // Try updating instead of removing and adding
    drawUpdatedZoomedHeatmap(zoomed_heatmap_node[i].id, element, file_name, data_name);
  }

  // Update visualization row
  for(; i<zoomed_heatmap_node.length; i++) {

    id = zoomed_heatmap_node[i].id.split("_")[3];
    main_timeframe_node = document.querySelector('#dropdown_heatmap_'+id);
    select_node = main_timeframe_node.parentNode.querySelector('select');
    value = select_node.value;
    data_name = zoomed_heatmap_node[i].value;

    element = value.split("_")[0];

    drawUpdatedZoomedHeatmap(zoomed_heatmap_node[i].id, element, value, data_name);
  }

  // // Update zoomed timeline domain
  // viewZoomedTimeline();
}


// For visualization row added / removed / updated by using dropdown

function addZoomedVisualizationRow(id, node_val, data_name) {

  // Check count
  zoomed_heatmap_node = $('.zoomed_timeframe_heatmap');
  len = zoomed_heatmap_node.length;

  if(len<5) {

    // Get new height
    zoomedHeatmapHeight = (zoomedTimelineHeight*4)/(len);
    zoomedGridHeight = zoomedHeatmapHeight*0.99;

    // Update height of all
    for(i=1; i<len; i++) {
      zoomed_heatmap_node[i].style.height = zoomedHeatmapHeight+"px";

      curr_node = d3.select(zoomed_heatmap_node[i]);
      curr_node.select(".zoomed_heatmap_svg").attr("height", zoomedHeatmapHeight*1.0);
      curr_node.select(".zoomed_svg_g").attr("height", zoomedHeatmapHeight*1.0);
      curr_node.selectAll(".zoomed_grid").attr("height", zoomedGridHeight);
    }
  }

  // Add row and set id
  node = zoomed_heatmap_node[len-1];
  copy = node.cloneNode(true);
  node.parentNode.insertBefore(copy, node);
  node.style.display = "block";
  node.id = id;
  node.value = data_name;

  // Update data
  drawUpdatedZoomedHeatmap(id, node_val.split("_")[0], node_val, data_name);
}

function removeZoomedVisualizationRow(id) {

  // Remove row
  document.querySelector('#'+id).remove();

  // Check count
  zoomed_heatmap_node = $('.zoomed_timeframe_heatmap');
  len = zoomed_heatmap_node.length-1;

  if(len<4) {

    // Get new height
    zoomedHeatmapHeight = (zoomedTimelineHeight*4)/(len);
    zoomedGridHeight = zoomedHeatmapHeight*0.99;

    // Update height of all
    for(i=1; i<=len; i++) {
      zoomed_heatmap_node[i].style.height = zoomedHeatmapHeight+"px";

      curr_node = d3.select(zoomed_heatmap_node[i]);
      curr_node.select(".zoomed_heatmap_svg").attr("height", zoomedHeatmapHeight*1.0);
      curr_node.select(".zoomed_svg_g").attr("height", zoomedHeatmapHeight*1.0);
      curr_node.selectAll(".zoomed_grid").attr("height", zoomedGridHeight);
    }
  }

}

function updateZoomedVisualizationRow(id, node_val, data_name) {

  // Update data if id already exists
  node = document.getElementById(id);
  if(node!=null) {
    node.value = data_name;
    drawUpdatedZoomedHeatmap(id, node_val.split("_")[0], node_val, data_name);
  }

}


// Update after noise cleaning
function updateDataFiles() {

  zoomed_heatmap_node = $('.zoomed_timeframe_heatmap');
  i = 1;

  // Update players
  for(; i<=player_count; i++) {

    node_id_split = zoomed_heatmap_node[i].id.split('_');

    // Player data
    element = "player";
    file_name = "player_" + node_id_split[3];
    tsvFile = "generated_files\\"+file_name+".tsv";
    data_name =  zoomed_heatmap_node[i].value;

    // Update zoomed heatmap for players
    drawZoomedHeatmap(zoomed_heatmap_node[i].id, tsvFile, element, file_name, data_name);
  }

  // Update visualization row
  for(; i<zoomed_heatmap_node.length; i++) {

    id = zoomed_heatmap_node[i].id.split("_")[3];
    main_timeframe_node = document.querySelector('#dropdown_heatmap_'+id);

    select_node = main_timeframe_node.parentNode.querySelector('select');
    value = select_node.value;
    element = value.split("_")[0];
    tsvFile = "generated_files\\"+value+".tsv";
    data_name = zoomed_heatmap_node[i].value;

    // Update zoomed heatmap for visualization rows
    drawZoomedHeatmap(zoomed_heatmap_node[i].id, tsvFile,  element, value, data_name);
  }
}



// Zoomed heatmap timeline
function setZoomedTimelineDimensions() {

  zoomedTimelineWidth = document.querySelector('#zoomed_timeframe_timeline').getBoundingClientRect().width;
  zoomed_margin.left = zoomedTimelineWidth*0.05;
	zoomed_margin.top = zoomedTimelineHeight*0.3;
  zoomed_margin.right = zoomedTimelineWidth - zoomedHeatmapWidth + (zoomedTimelineWidth*0.05);

  zoomedTimelineWidth -= zoomed_margin.left + zoomed_margin.right;
}


function viewZoomedTimeline() {

	// total_frames = tf;

  // Remove previous timeline svg's
  d3.select("#zoomed_timeframe_timeline").selectAll("svg").remove();

	var zoomed_svg2 = d3.select("#zoomed_timeframe_timeline").append("svg")
			.attr("width", zoomedTimelineWidth + zoomed_margin.left + zoomed_margin.right)
			.attr("height", zoomedTimelineHeight + zoomed_margin.top + zoomed_margin.bottom)
			.append("g")
				.attr("transform", "translate(" + zoomed_margin.left + "," + zoomed_margin.top + ")");

	// Class: slider
	zoomed_x = d3.scaleLinear()
	    .domain([20, 300])
	    .range([0, zoomedTimelineWidth])
	    .clamp(true);

	var zoomed_slider = zoomed_svg2.append("g")
	    .attr("class", "zoomed_slider")
      .attr("width", zoomedTimelineWidth)
			.attr("height", zoomedTimelineHeight*0.6);

	zoomed_slider.append("line")
	    .attr("class", "zoomed_track")
	    .attr("x1", zoomed_x.range()[0])
	    .attr("x2", zoomed_x.range()[1])
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "zoomed_track-inset")
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "zoomed_track-overlay")
	    .call(d3.drag()
	        .on("start.interrupt", function() {
						zoomed_slider.interrupt();
					})
	        .on("start drag", function() {
						change_zoomed_handle_value((zoomed_x.invert(d3.event.x)));
					}));

	zoomed_slider.insert("g", ".zoomed_track-inset")
	    .attr("class", "zoomed_ticks")
	    .attr("transform", "translate(0," + (zoomed_margin.top + (zoomedTimelineHeight*0.2)) + ")")
	  .selectAll("text")
	  .data(zoomed_x.ticks(4))
	  .enter().append("text")
	    .attr("x", zoomed_x)
	    .attr("text-anchor", "middle")
			.style("fill", "#fff7bc")
	    .text(function(d) { return d; });

	zoomed_handle = zoomed_slider.insert("circle", ".zoomed_track-overlay")
	    .attr("class", "zoomed_handle")
	    .attr("r", 6);

}

function change_zoomed_handle_value(val) {

	// Get handle position
	zoomed_handle_value = parseInt(val);

	// Set handle value
	zoomed_handle.attr("cx", zoomed_x(zoomed_handle_value));

  // Update Zoomed Heatmap Size
  zoomed_heatmap_size = zoomed_handle_value;
  first_half_zoomed_heatmap_size = zoomed_heatmap_size/2;
  last_half_zoomed_heatmap_size = total_frames - first_half_zoomed_heatmap_size;

  // Update grid width
  zoomedGridWidth = parseFloat(zoomedHeatmapWidth/zoomed_heatmap_size);

  updateZoomedVisualizationHeatmap(main_timeline_handle_value);
}
