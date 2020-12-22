// For Heatmap
var heatmapWidth = 0, heatmapHeight = 0,
    gridWidth = 0, gridHeight = 0,
    total_frames = 20202, frame_start = 0;

heatmap_data_files = {};

// Replicate each timeframe label
function multiplyTimeframeLabelNode(node, count, deep, labels) {

  for (var i = 0, copy; i < count; i++) {
      copy = node.cloneNode(deep);
      node.parentNode.insertBefore(copy, node);

      node.style.display = "block";
      node.id = "timeframe_label_"+labels[i];
      node.querySelector('.label').innerHTML = labels[i];
      node.querySelector('.timeframe_heatmap').id = "timeframe_heatmap_"+labels[i];
  }
}

saveFiles = function(tsvFile, map_name) {

  // Read TSV File
  d3.tsv(tsvFile, function(d) {
    return {
      frame_no: +d.frame_no,
      value: +d.value
    };
  },

  function(error, data) {
     heatmap_data_files[map_name] = data;
  });

};

// Set options of Dropdown
function setVisualizationDropdownOptions(node, player_pair_names) {
  node.innerHTML = "";

  // Gaze distance option
  for(i=0; i<player_pair_names.length; i++) {
    player_names = player_pair_names[i].split("_");

    node.innerHTML += "<option value='gaze-distance_"+ player_pair_names[i] +"'>"
                        + "Gaze Distance (" + player_names[0] + "," + player_names[1] + ")"
                        + "</option>";
  }

  // Add other options here if required
}

// Remove timeframe visualization row
function remove_timeframe_dropdown_row(node) {

  // Find id
  curr_id = node.parentNode.parentNode.querySelector('.timeframe_heatmap').id;
  zoomed_heatmap_id = curr_id.split("_")[2];

  // Remove tag by removing entire add_tag_row
  node.parentNode.parentNode.remove();

  // Remove visualization row from zoomed heatmap
  removeZoomedVisualizationRow("zoomed_timeframe_heatmap_" + zoomed_heatmap_id);

  // Set vertical line height
  document.querySelector('#vertical_line_container').style.height = (document.getElementById('timeframe_svg_row').getBoundingClientRect().height - 4)+"px";

  // Set highlighter height
  document.querySelector('#highlighter_container').style.height = (document.getElementById('timeframe_svg_row').getBoundingClientRect().height - 4)+"px";
}

// Draw HeatMap for each player
function multiplyPlayerHeatmap(className, player_count, player_names, frame_start_val, total_frames_val) {

  // Find start frame number after offset and total frame
  frame_start = frame_start_val;
  total_frames = total_frames_val;

  // Get Dimensions
  node = ($('.timeframe_label_row'))[1];

  // Set width and height for heatmap
  heatmapWidth = node.querySelector('.timeframe_heatmap').getBoundingClientRect().width;
  heatmapHeight = ((document.querySelector('#center_timeframe_layout').getBoundingClientRect().height)*0.64)/4;

  // Set gridWidth and gridHeight for heatmap grids
  gridWidth = parseFloat(heatmapWidth/total_frames);
  gridHeight = heatmapHeight*0.99;

  // Draw heatmap for each node
  heatmap_node = $(className);

  for(var i = 1; i<=player_count; i++) {
    tsvFile = "generated_files\\player_"+player_names[i-1]+".tsv";

    // if(i%2==0)
    //   saveFiles("generated_files\\gaze-distance_"+player_names[i-2]+"_"+player_names[i-1]+".tsv", "gaze-distance_"+player_names[i-2]+"_"+player_names[i-1]);

    drawHeatmap(heatmap_node[i].id, tsvFile, 'player');
  }

  // Display timeline below heatmap
  // svg_row_height = (node.getBoundingClientRect().height)*4;
  timeline_height = (document.querySelector('#center_timeframe_layout').getBoundingClientRect().height)*0.12;
  setTimelineDimensions(heatmapWidth, timeline_height, gridWidth);

}

// Update visualization heatmap when dropdwon value changes
function updateVisualizationHeatmap(select_node, caller) {

  heatmap_node = select_node.parentNode.parentNode.querySelector('.timeframe_heatmap');
  tsvFile = "generated_files\\" + select_node.value + ".tsv";

  // value_split = ((select_node.value).split("_")[0]).split("-");
  element = (select_node.value).split("_")[0];

  // Update heatmap
  drawHeatmap(heatmap_node.id, tsvFile, element);

  // Update zoomed visualization row
  if(caller=="dropdown") {
    zoomed_heatmap_id = heatmap_node.id.split("_")[2];
    data_name = select_node.options[select_node.selectedIndex].text;
    updateZoomedVisualizationRow("zoomed_timeframe_heatmap_" + zoomed_heatmap_id, select_node.value, data_name);
  }
}

// Heatmap
var drawHeatmap = function(id, tsvFile, element) {

  // Remove previous heatmap svg's
  d3.select("#"+id).selectAll("svg").remove();

  // Create new svg for heatmap
  var svg = d3.select("#"+id).append("svg")
      .attr("class", "heatmap_svg")
      .attr("width", heatmapWidth)
      .attr("height", heatmapHeight*1.0)
      .append("g");

  // Read TSV File
  d3.tsv(tsvFile, function(d) {
    return {
      frame_no: +d.frame_no,
      value: +d.value
    };
  },

  function(error, data) {

    var cards = svg.selectAll(".frame_no")
        .data(data, function(d) { return d.frame_no; });

    cards.enter()
      .append("rect")
        .attr("x", function(d) { return (d.frame_no * gridWidth); })
        .attr("class", "grid")
        .attr("width", gridWidth)
        .attr("height", gridHeight)
        .style("fill", (d) => getColor(element, d.value))
      .append("title")
        .text( (d) => ("Frame #" + d.frame_no + "\n" + getTooltip(element, d.value)));

    cards.exit().remove();

  });

};

// Get Tooltip value for Heatmap
function getTooltip(element, val) {

  if(element=='player') {

    if(val==1)
      return "Off surface";
    else if(val==1000)
      return "On Surface";
    else if(val==100)
      return "Noisy Frame";
    else if(val==10)
      return "Missing Frame";

  } else if(element=='gaze-distance')	{

    if(val==1000)
      return "One Player's Frame Missing";
    if(val==100000)
      return "Both Players Frame Missing";
    else
      return "Gaze Distance: "+val;

  }
}

// Get Color value for Heatmap
function getColor(element, val) {

  if(element=='player') {

    if(val==1)								    // Off surface - yellow
      return "#fff7bc";
    else if(val==1000)						// On surface - purple
      return "#9744be";
    else if(val==100)             // Noisy - green
      return "#000000";
    else if(val==10)						  // Missing - dark orange
      return "#4d4d4d";

  } else if(element=='gaze-distance')	{

    if(val==1000)                 // One players's frame missing - Light orange
      return "#fdae6b";
    if(val==100000)               // Both players frame missing	- red
      return "#ff0000";
    else if(val>=0 && val<=0.2)   // Distances - shades of blue (Dark)
      return "#1034a6";
    else if(val>0.2 && val<=0.4)
      return "#009dff";
    else if(val>0.4 && val<=0.6)
      return "#26abff";
    else if(val>0.6 && val<=0.8)
      return "#59bfff";
    else if(val>0.8 && val<=1.0) // Distances - shades of blue (Light)
      return "#8cd3ff";
  }
}

function resizeHeatMap() {

  node = ($('.timeframe_label_row'))[1];

  // Set width and height for heatmap
  heatmapWidth = node.querySelector('.timeframe_heatmap').offsetWidth;
  heatmapHeight = node.querySelector('.timeframe_label').offsetHeight;

  // Set gridWidth and gridHeight for heatmap grids
  gridWidth = parseFloat(heatmapWidth/total_frames);
  gridHeight = heatmapHeight;

  $(".heatmap_svg").attr("width",  heatmapWidth);
  $(".heatmap_svg").attr("height", heatmapHeight);

  // $(".heatmap_svg g rect").attr("x", function(d) { return (d.frame_no * gridWidth); });
  $(".heatmap_svg g rect").attr("width", parseFloat(heatmapWidth/total_frames));
  $(".heatmap_svg g rect").attr("height", heatmapHeight);

  // Resize timeline dimensions
  svg_row_height = (node.parentNode.getBoundingClientRect().height)*3;
  setTimelineDimensions(heatmapWidth, ((svg_row_height/66.66)*15), gridWidth);
}
