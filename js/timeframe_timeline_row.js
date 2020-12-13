var margin = {top: 0, bottom: 0, left: 0, right: 0};
var width = 0, height = 0;
var x = null, handle_value = 0;
var vertical_line_node = null, tooltip_node = null,
grid_width = 0, total_frames = 0;

function setTimelineDimensions(w, h, gw) {
	margin.left = margin.right = (w/95)*2.5;
	margin.top = h*0.6;

	width = w;
  height = h;

	grid_width = gw;
}

function viewTimeline(tf) {

	total_frames = tf;

  // Remove previous timeline svg's
  d3.select("#timeframe_timeline").selectAll("svg").remove();

	var svg2 = d3.select("#timeframe_timeline").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Class: slider
	x = d3.scaleLinear()
	    .domain([0, total_frames-1])
	    .range([0, width])
	    .clamp(true);

	var slider = svg2.append("g")
	    .attr("class", "slider")
      .attr("width", width)
			.attr("height", height*0.3);

	slider.append("line")
	    .attr("class", "track")
	    .attr("x1", x.range()[0])
	    .attr("x2", x.range()[1])
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-inset")
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-overlay")
	    .call(d3.drag()
	        .on("start.interrupt", function() {
						slider.interrupt();
					})
	        .on("start drag", function() {
						change_handle_value((x.invert(d3.event.x)), "timeline_handle");
					}));

	slider.insert("g", ".track-overlay")
	    .attr("class", "ticks")
	    .attr("transform", "translate(0," + (margin.top + (height*0.15)) + ")")
	  .selectAll("text")
	  .data(x.ticks(10))
	  .enter().append("text")
	    .attr("x", x)
	    .attr("text-anchor", "middle")
			.style("fill", "#fff7bc")
	    .text(function(d) { return d; });

	handle = slider.insert("circle", ".track-overlay")
	    .attr("class", "handle")
	    .attr("r", 5);

	// // Display vertical line at the start
	// vertical_line_node = document.querySelector('#vertical_line');
	tooltip_node = document.querySelector('#timeline_tooptip').querySelector('.label');

	change_handle_value(0, "timeline_handle");

	// To bring all player videos to same offset
	move_videos_to_handle_position(handle_value);
}

function change_handle_value(val, caller) {

	// Get handle position
	handle_value = parseInt(val);

	// Set handle value
	handle.attr("cx", x(handle_value));

	// Change tooltip value
	tooltip_node.innerHTML = "Frame: " + handle_value;

	// // Move vertical line on heatmap
	// vertical_line_node.style.marginLeft = parseInt(grid_width*parseInt(handle_value))+"px";

	if(caller!="play_all_videos") {
		// Move cursor on all videos
		move_videos_to_handle_position(handle_value);
	}

	// Change zoomed heatmap
	updateZoomedVisualizationHeatmap(handle_value);
}

function getHandleValue() {
	return handle_value;
}

function timeline_goto_previous_frame() {
	if(handle_value-1>=0)
		change_handle_value(handle_value-1, "timeline_goto_previous_frame");
	else
		alert("You are at the first frame!");
}

function timeline_goto_next_frame() {
	if(handle_value+1<total_frames)
		change_handle_value(handle_value+1, "timeline_goto_next_frame");
	else
		alert("You are at the last frame!");
}

function resizeTimeline() {

	// To save previous values
	temp_h = handle_value;
	temp_tf = total_frames;

	// View timeline with resized dimensions
	viewTimeline(temp_tf);

	// Set handle to previous value
	change_handle_value(temp_h);

	// To bring all player videos to same offset
	move_videos_to_handle_position(handle_value);

}
