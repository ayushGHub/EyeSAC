// Data files
data_count = 0;
data_sources = [];
data_labels = [];
set_start_count = 0;
total_frames = 0

function set_values_left_menu(d_count, d_sources, d_labels) {
  set_start_count = 0;
  data_count = d_count;
  data_sources = d_sources;
  data_labels = d_labels;
  total_frames = 0;
}

function set_start() {

  proceed = true;
  if(set_start_count>0)
     proceed = confirm("All current changes will be lost! Do you want to continue?");

  if(proceed) {

    // Offset video
    values = setStartVideo();

    // Ask Confirmation if difference in any video length > 5 secs
    if(values.max_duration_difference > 5)
      proceed = confirm("Video lengths differ by more than 5 secs! Do you want to continue?");

    // If true: Do the rest
    if(proceed) {

      // Increment set_start count
      set_start_count++;

      // Display Spinner
      document.getElementById("spinner").style.display = "block";

      // Calculate frame start
      frame_start = parseInt((values.min_player_start_time) * 60);
      total_frames = 20201-frame_start+1;
      set_values_right_details(data_count, data_sources, data_labels, frame_start, total_frames);

      // Set noise threshold by default
      noise_threshold = 0.5;
      caller = "set_start";

      // Generate timeframe, stats and line chart files
      $.ajax({
  			url: 'http://127.0.0.1:5000/generate_data',
        type: 'POST',
        data: JSON.stringify({data_sources, data_labels, noise_threshold, frame_start, total_frames, caller}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        crossDomain: true,
        success: function(data) {

          // Setup Line Chart
          readLineChartData(player_pair_names, frame_start, total_frames);

          // Display Statistics
          displayStats();

          // Set blocks visible
          document.querySelector('#right_details').style.display = "block";
          document.querySelector('#right_tag_names').style.display = "block";
          document.querySelector('#center_timeframe_layout').style.display = "inline-block";
          document.querySelector('#bottom_layout').style.display = "inline-block";

          // Set highlighter height
          document.querySelector('#highlighter_container').style.height = ((document.querySelector('#timeframe_svg_row').clientHeight)*1.02)+"px";

          // Enable buttons
          node_enable_disable = $('.button_enable_disable');
          for(i=0; i<node_enable_disable.length; i++)
            node_enable_disable[i].disabled = false;

          // Display timeframe and zoomed
          multiplyPlayerHeatmap('.timeframe_heatmap', data_count, data_labels, frame_start, total_frames);
          multiplyZoomedPlayerHeatmap(data_count, data_labels, total_frames);

          // View heatmap timeline and zoomed
          viewTimeline(total_frames);
          viewZoomedTimeline();

          // Hide Spinner
          document.getElementById("spinner").style.display = "none";
        }
      });

    } else {
      // Reset start of video to 0
      resetStartVideo();
    }
  }

}

function play_all() {

  // Get handle value
  handle_value = getHandleValue();

  // Move all videos to handle postion
  move_videos_to_handle_position(handle_value);

  // Change status in other files - To make timeline move
  setPlayAllStatus_in_CenterVideos(true);

  // Play all videos
  videos = $('.video');
  for(i=1; i<videos.length; i++)
    videos[i].play();

}

function pause_all() {

  // Pause all videos
  videos = $('.video');
  for(i=1; i<videos.length; i++)
    videos[i].pause();

  // Change status in other files - To stop timeline from moving
  setPlayAllStatus_in_CenterVideos(false);

}

function clearNoise(frame_intervals) {
  // Display Spinner
  document.getElementById("spinner").style.display = "block";

  // Clean noise throuhgout and remake timeframe, stats and line chart files
  $.ajax({
    url: 'http://127.0.0.1:5000/cleanNoise',
    type: 'POST',
    data: JSON.stringify({data_labels, frame_intervals}),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    success: function(data) {

      // Setup Line Chart
      readLineChartData(player_pair_names, frame_start, total_frames);

      // Display Statistics
      displayStats();

      // Update timeframe for players
      multiplyPlayerHeatmap('.timeframe_heatmap', data_count, data_labels, frame_start, total_frames);

      // Update heatmap for visualization if already present
      node = $('.timeframe_dropdown_row');
      for(i=1; i<node.length; i++)
        updateVisualizationHeatmap(node[i].querySelector('select'), 'noise_clean');

      // View heatmap timeline
      // viewTimeline(total_frames);

      // Display zoomed timeframe
      updateDataFiles();

      // Hide Spinner
      document.getElementById("spinner").style.display = "none";

    }
  });
}

function clean_noise_throughout() {
  clearNoise([[0, total_frames-1]]);
}

function add_manual_noise_removal() {

  manual_noise_removal_row = document.querySelector('#timeframe_manual_noise_removal_row');

  if(manual_noise_removal_row.style.display=="none") {

    // Display row
    manual_noise_removal_row.style.display = "block";

    add_manual_noise_removal_cursor(document.querySelector('#timeframe_manual_noise_removal_row'))


    $('.noise_removal_cursor').resizable({
              grid: [1, 10000]
    });
    $('.noise_removal_cursor').draggable({axis:"x", containment:"parent"});

    // Change top margin of highlighter
    document.querySelector('#highlighter_container').style.marginTop = "0.7%";
  }

}

function add_tag() {

  // Get tag_label row
  node = document.querySelector('.add_tag_row');

  // Find count current number of tags
  last_count = node.id.split("_")[2];
  new_count = parseInt(last_count)+1;

  // Replicate each add_tag_label
  copy = node.cloneNode(true);
  node.id = "tag_label_"+ last_count;   // Added node
  copy.id = "tag_label_"+ new_count;    // Original node
  node.parentNode.insertBefore(copy, node);
  node.style.display = "inline-block";

  node.querySelector('.plus').click();

  // Replicate each tag_highlight_button
  node = document.querySelector('.tag_highlight_button');
  copy = node.cloneNode(true);
  node.id = "tag_button_"+ last_count;   // Added node
  copy.id = "tag_button_"+ new_count;    // Original node
  node.parentNode.insertBefore(copy, node);
  node.style.display = "inline-block";




  $('.tag_cursor').resizable({
            grid: [1, 10000]
  });
  $('.tag_cursor').draggable({axis:"x", containment:"parent"});
}

function add_visualization() {
  // Get timeframe_dropdown_row
  node = document.querySelector('.timeframe_dropdown_row');

  // Find count current number of rows
  last_count = node.querySelector('.timeframe_heatmap').id.split("_")[2];
  new_count = parseInt(last_count)+1;

  // Replicate node
  copy = node.cloneNode(true);

  node.querySelector('.timeframe_heatmap').id = "dropdown_heatmap_"+ last_count;   // Added node
  copy.querySelector('.timeframe_heatmap').id = "dropdown_heatmap_"+ new_count;    // Original node

  node.parentNode.insertBefore(copy, node);
  node.style.display = "block";

  // Update heatmap when node is first created
  select_node = node.querySelector('select');
  updateVisualizationHeatmap(select_node);

  // Create new node in zoomed heatmap
  data_name = select_node.options[select_node.selectedIndex].text;
  addZoomedVisualizationRow("zoomed_timeframe_heatmap_"+last_count, select_node.value, data_name);

  // Set highlighter height
  document.querySelector('#highlighter_container').style.height = ((document.querySelector('#timeframe_svg_row').clientHeight)*1.02)+"px";
}
