// For line chart
var margin = { top: 0, left: 0 },
width = 0, height = 0;;
screen_labels = [];
line_chart_data = null;
video_ids = [];
let video_start_time = new Map();
frame_start = 0, total_frames = 0;

// For play / Pause all videos
var play_all_clicked = false;

// Replicate videos
function multiplyVideoNode(node, count, deep, source, labels) {

    for (var i = 0, copy; i < count; i++) {

        // Dupliate video block
        copy = node.cloneNode(deep);
        node.parentNode.insertBefore(copy, node);

        // Make video block visible and set ID
        node.style.display = "block";
        node.id = "video_block_" + labels[i];

        // Set video source
        video_node = node.querySelector('.video');
        video_node.src = source[i];
        video_node.id = "video_"+labels[i];

        // Set start frame number to 0 by default
        video_start_time.set(labels[i], 0);

        // For line_chart div to be enabled only for screen videos
        labels_list = labels[i].split("-");
        if(labels_list[0]=="screen") {

          video_id = "video_"+labels_list[1]+"_"+labels_list[2];
          video_node.id = video_id;
          screen_labels.push(labels_list[1]+"_"+labels_list[2]);
          video_ids.push(video_id);

          line_chart_name = "line-chart_"+labels_list[1]+"_"+labels_list[2];

          line_chart_node = node.querySelector('.line_chart');
          line_chart_node.id = line_chart_name;
          line_chart_node.style.display = "block";
        }
    }
}


// For Line Chart
const type2 = (d) => {
	return {
		idx: d.world_frame_idx,
		m_x: d.player1_x,
		m_y: d.player1_y,
		b_x: d.player2_x,
		b_y: d.player2_y,
		dist: d.dist
	};
};

let line_chart_data_map = new Map();
let line_chart_video_map = new Map();


// Call for every frame
function draw_line_chart(line_chart_name, frame) {

  players = line_chart_name.split("_");
  video_name = "video_block_screen-"+players[1]+"-"+players[2];

  low = ((line_chart_data_map.get(line_chart_name))*20202) + frame;
  a1 = line_chart_data.slice(low, low+1);

  // Get (x,y) for both players
  var mx = a1.map(function(d){return d.m_x});
  var my = a1.map(function(d){return d.m_y});
  var bx = a1.map(function(d){return d.b_x});
  var by = a1.map(function(d){return d.b_y});

  // Remove previous svg's
  d3.select("#"+line_chart_name).selectAll("svg").remove();

  // For X axis of line
  var xScaleLine = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width]);

  // For Y axis of line
  var yScaleLine = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

  // SVG for line chart
  var svg_line = d3.select("#"+line_chart_name).append("svg")
      .attr("width", width+margin.left)
      .attr("height", height+margin.top)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Appends a circle for first player
  svg_line.selectAll(".dot")
      .data(a1)
    .enter().append("circle")
      .attr("class", "dot1")
      .attr("cx", function(d, i) { return xScaleLine(d.m_x) })
      .attr("cy", function(d) { return yScaleLine(d.m_y) })
      .attr("r", 5);

  // 12. Appends a circle for second player
  svg_line.selectAll(".dot")
      .data(a1)
    .enter().append("circle")
      .attr("class", "dot2")
      .attr("cx", function(d, i) { return xScaleLine(d.b_x) })
      .attr("cy", function(d) { return yScaleLine(d.b_y) })
      .attr("r", 5);
}

function setLineChartDimensions() {

  vnode = $('.video')[1];

  videoTagWidth = vnode.offsetWidth;
  videoTagHeight = vnode.offsetHeight;

  if(videoTagWidth>=(16*videoTagHeight/9)) {     // Width is more than required

    width = parseInt((videoTagHeight*(16/9)*0.94));
    height = parseInt(videoTagHeight*0.974);

    margin.left = Math.ceil((videoTagWidth-width)/2)+2;
    margin.top = Math.ceil((videoTagHeight-height)/2);

  } else {                                      // Height is more than required

    height = parseInt((videoTagWidth*(9/16)*0.974));
    width = parseInt(videoTagWidth*0.94);

    margin.left = Math.ceil((videoTagWidth-width)/2)+2;
    margin.top = Math.ceil((videoTagHeight-height)/2);

  }
}

function setupLineChart(player_pair_names) {

  // Make VideoFrame, onplay, onpause function for each screen
  for(i=0; i<player_pair_names.length; i++) {

      line_chart_name = "line-chart_"+player_pair_names[i];
      line_chart_data_map.set(line_chart_name, i);

      // Remove previous svg's
      d3.select("#"+line_chart_name).selectAll("svg").remove();

      // If data for pair is present but screen is not there
      // Don't add the functions, go for next pair
      if(!screen_labels.includes(player_pair_names[i]))
        continue;

      var video = VideoFrame({
          id : 'video_'+player_pair_names[i],
          frameRate: 60,
          callback : function(frame) {
            str_split = this.id.split("_");
            frame_no = frame-(parseInt(video_start_time.get("screen-"+str_split[1]+"-"+str_split[2])*60));
            if(frame_no>=0 && frame_no<total_frames) {
              id = "line-chart_"+str_split[1]+"_"+str_split[2];
              draw_line_chart(id, frame_no);
            }
          }
      });

      line_chart_video_map.set(line_chart_name, video);

      document.getElementById("video_"+player_pair_names[i]).onplay = function() {
        str_split = this.id.split("_");
        line_chart_video_map.get("line-chart_"+str_split[1]+"_"+str_split[2]).listen('frame');
      };

      document.getElementById("video_"+player_pair_names[i]).onpause = function() {
        str_split = this.id.split("_");
        line_chart_video_map.get("line-chart_"+str_split[1]+"_"+str_split[2]).stopListen();
      };

      document.getElementById("video_"+player_pair_names[i]).ontimeupdate = function() {
          str_split = this.id.split("_");
          frame_no = parseInt(this.currentTime*60)-(parseInt(video_start_time.get("screen-"+str_split[1]+"-"+str_split[2])*60));;
          if(frame_no>=0 && frame_no<total_frames) // Draw Line chart
            draw_line_chart(("line-chart_"+str_split[1]+"_"+str_split[2]), frame_no);
          else // Remove previously drawn line chart
            d3.select("#line-chart_"+str_split[1]+"_"+str_split[2]).selectAll("svg").remove();
      };
    }
}

function readLineChartData(player_pair_names, f_start, t_frames) {
  frame_start = f_start;
  total_frames = t_frames;

  // Read tsv file for line chart
  d3.tsv("generated_files\\line-chart.tsv", type2, (error, data) => {
  	  line_chart_data = data;

      // Set Dimensions for Line Chart
      setLineChartDimensions();

      // Setup listen to draw_line_chart for play, pause, update
      setupLineChart(player_pair_names);
  });
}

// To get video offset for heatmap

// Set video offset
function setStartVideo() {

  // To select node based on which play all will work
  playAllSelectedVideoNode = null, maxDurationVideoNode = null;

  var min_duration = Number.MAX_SAFE_INTEGER, max_duration = 0,
  min_player_start_time = Number.MAX_SAFE_INTEGER, min_player_end_time = Number.MAX_SAFE_INTEGER;

  for (const [key, value] of video_start_time.entries()) {
    video_node = document.querySelector('#video_block_'+key).querySelector('.video');
    start_time = parseFloat(video_node.currentTime);
    video_start_time.set(key, start_time);

    video_duration = video_node.duration-start_time;
    min_duration = Math.min(min_duration, video_duration);

    if(video_duration>max_duration) {
      max_duration = Math.max(max_duration, video_duration);

      // This will be used if no player videos exist
      maxDurationVideoNode = video_node;
    }

    if(key.split("-")[0]=="player") {
      if(start_time<min_player_start_time) {
        min_player_start_time = start_time;
        playAllSelectedVideoNode = video_node;
      }
    }
  }

  // Change offset of all player files to the one chosen
  for (const [key, value] of video_start_time.entries()) {
    if(key.split("-")[0]=="player") {
      video_start_time.set(key, min_player_start_time);
    }
  }

  // No player files
  if(min_player_start_time==Number.MAX_SAFE_INTEGER) {
    // Assume frame_start = 0
    min_player_start_time = 0

    playAllSelectedVideoNode = maxDurationVideoNode;
  }

  setupPlayAll(playAllSelectedVideoNode);

  return {max_duration_difference: (max_duration-min_duration), min_player_start_time: min_player_start_time};
}

// Reset video offset
function resetStartVideo() {
  for (const [key, value] of video_start_time.entries())
    video_start_time.set(key, 0);
}

// Move all videos when heatmap timeline is dragged
function move_videos_to_handle_position(handle_value) {
  for (const [key, value] of video_start_time.entries()) {
    video_node = document.querySelector('#video_block_'+key).querySelector('.video');
    video_node.currentTime = value + (handle_value/60);
  }
}

function setupPlayAll(videoNode) {

  id = videoNode.id;

  // Get start time
  parent = videoNode.parentNode.id.split("_");
  key = ""
  for(i=2; i<parent.length; i++) {
    key += parent[i];
    if(i+1<parent.length)
    key += "_";
  }
  start_time = video_start_time.get(key);

  var play_all_video = VideoFrame({
      id : id,
      frameRate: 60,
      callback : function(frame) {

        frame_no = frame-(parseInt(start_time*60));

        // If play all has been clicked
        if(play_all_clicked && frame_no>=0 && frame_no<total_frames) {
          // Move timeline handle
          change_handle_value(frame_no, "play_all_videos");
        }

      }
  });

  document.getElementById(id).onplay = function() {
    str_split = this.id.split("_");
    play_all_video.listen('frame');
  };

  document.getElementById(id).onpause = function() {
    play_all_video.stopListen();
  };
}

function setPlayAllStatus_in_CenterVideos(status) {
	play_all_clicked = status;
}

function resizeLineChart() {
  // Reset dimensions
  setLineChartDimensions();
}

function find_video_frames(node, id) {

  nodewidth = $(node).width();
  node_left = $(node).offset().left;
  frame_width = nodewidth/total_frames;

  cursors = $(node).find('.video_cursor');

  // cursors = node.childNodes;

  output = []
  for(i=1; i<cursors.length; i++){

    cursor_left = parseInt((cursors[i].getBoundingClientRect().left - node_left)/frame_width);
    cursor_right = parseInt((cursors[i].getBoundingClientRect().right - node_left)/frame_width);
    console.log(cursor_left + "***" + cursor_right + "***" + video_start_time.get(id));
    cursor_start_time = parseFloat(cursor_left/60) + video_start_time.get(id);
    cursor_end_time = parseFloat(cursor_right/60) + video_start_time.get(id);
    console.log(cursor_start_time + "---" + cursor_end_time);
    output.push([cursor_start_time, cursor_end_time]);

  }

  return output;
}
