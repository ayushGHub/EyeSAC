// Keep track of how many times visualize button is clicked
var countVisualizeButtonClicks = 0;

// Data and video files
data_count = 0;
data_sources = [];
data_labels = [];
player_pair_names = [];

video_count = 0;
video_sources = [];
video_labels = [];

// Validate is visualize show be performed
function validate(data_count, video_count) {

  // Validate count of data and video files
  if(data_count==0) {
    alert("Choose data files!");
    return false;
  } else if(video_count==0) {
    alert("Choose video files!");
    return false;
  } else if(data_count%2!=0) {
    alert("Even number of player's data required!");
    return false;
  } else {

    // Show data loss warning if visualize button is clicked more than once
    countVisualizeButtonClicks++;
    if(countVisualizeButtonClicks>1)
      return(confirm("All current changes will be lost! Do you want to continue?"));

    // If visualize is clicked first time
    // OR user does not mind loss of changes
    return true;

  }

}

function removeNodes(nodes) {
  for(i=1; i<nodes.length; i++) // Remove all added nodes
    nodes[i].remove();
}

function clearElements() {
  // Remove nodes
  removeNodes($('.video_block'));            // Video blocks
  removeNodes($('.stats_player_missing'));  // Stats Player Missing Frames
  removeNodes($('.stats_player_noise'));    // Stats Player Noise
  removeNodes($('.zoomed_timeframe_heatmap'));    // Zoomed Timeframe Labels
  removeNodes($('.tag_highlight_button'));   // Tag highlight buttons
  removeNodes($('.highlighter'));             // Highlighter
  removeNodes($('.timeframe_label_row'));    // Timeframe Labels
  removeNodes($('.timeframe_dropdown_row')); // Timeframe dropdowns
  removeNodes($('.add_tag_row'));            // Add tag labels
  removeNodes($('.combine_video_row'));      // Combine video labels

  // Set id of original row = 0
  $('.tag_highlight_button')[0].id = "tag_button_0";  // Tag Buttons
  $('.add_tag_row')[0].id = "tag_label_0";            // Tag Labels
  node = $('.timeframe_dropdown_row')[0];
  node.querySelector('.timeframe_heatmap').id = "dropdown_heatmap_0";  // Dropdown Heatmap

  // Hide timeframe and bottom layout until set start is clicked
  document.querySelector('#right_details').style.display = "none";
  document.querySelector('#right_tag_names').style.display = "none";
  document.querySelector('#center_timeframe_layout').style.display = "none";
  document.querySelector('#bottom_layout').style.display = "none";

  // Make stats table rows blank
  document.querySelector('#stats_total_frames').innerHTML = "";
  document.querySelector('#noise_threshold_text').value = "";
}

function multiplyNodes() {
  // Function call to create multiple videos
  multiplyVideoNode(document.querySelector('.video_block'), video_count, true, video_sources, video_labels);

  // Function call set stats rows
  multiplyStatsRow(document.querySelector('.stats_player_missing'), data_count, true);
  multiplyStatsRow(document.querySelector('.stats_player_noise'), data_count, true);
  altTableRows();

  // Function call to create multiple timeframe labels
  multiplyTimeframeLabelNode(document.querySelector('.timeframe_label_row'), data_count, true, data_labels);
  multiplyZoomedTimeframeNode(document.querySelector('.zoomed_timeframe_heatmap'), data_count, true, data_labels);

  // Function call to set values of timeframe dropdowns
  setVisualizationDropdownOptions(document.querySelector('.timeframe_dropdown').querySelector('select'), player_pair_names);

  // Function call to create multiple combine video rows
  multiplyCombineVideoNode(document.querySelector('.combine_video_row'), video_count, true, video_labels, video_sources);
}

function visualize() {

  // Get uploaded data and videos
  data_files = document.querySelector('#uploadData').files;
  data_count = data_files.length;
  video_files = document.querySelector('#uploadVideos').files;
  video_count = video_files.length;

  if(validate(data_count, video_count)) {

    document.querySelector('#center_display').style.display = "block";  // Show center_display layout
    disableButtons();
    clearElements();  // Clear existing elements to refresh view

    // Get data sources
    data_sources = [];
    data_labels = [];
    i = 0;
    for( ; i < data_count; i++) {
      name = data_files[i].name
      data_sources.push(("datasets/"+name));
      data_labels.push(name.split(".")[0]);
    }

    // Get video sources
    video_sources = [];
    video_labels = [];
    i = 0;
    for( ; i < video_count; i++) {
      name = video_files[i].name
      video_sources.push(("videos/"+name));
      video_labels.push(name.split(".")[0]);
    }

    player_pair_names = [];
    for(i=0; i<data_labels.length; i=i+2)
      player_pair_names.push(data_labels[i]+"_"+data_labels[i+1]);

    // Set values for left menu
    set_values_left_menu(data_count, data_sources, data_labels);

    // Multiply nodes that depend on number of video / data files
    multiplyNodes();

  }
}

function find_frames(node) {

  nodewidth = $(node).width();
  node_left = $(node).offset().left;
  frame_width = nodewidth/total_frames;

  cursors = $(node).find('.tag_cursor');

  // cursors = node.childNodes;

  output = []
  for(i=1; i<cursors.length; i++){

    cursor_left = parseInt((cursors[i].getBoundingClientRect().left - node_left)/frame_width);
    cursor_right = parseInt((cursors[i].getBoundingClientRect().right - node_left)/frame_width);
    output.push([cursor_left, cursor_right]);

  }

  return output;
}


function exportData() {

  tag_row = $('.add_tag_row');

  tag_name_dict = {};

  tag_name_list = []
  tag_name_set = new Set();

  for(i=1; i<tag_row.length; i++){

    tag_name = $(tag_row[i]).find('.label').val();

    if(tag_name==""){
      alert("One of the tag names is empty. Kindly set a name for each tag!");
      break;
    }
    else if(tag_name_set.has(tag_name)){
      alert("Tag names must be unique");
      break;
    }
    else{
      tag_name_list.push(tag_name);
      tag_name_set.add(tag_name);
    }

  }


  if(tag_name_list.length == tag_row.length-1){

    // Display Spinner
    document.getElementById("spinner").style.display = "block";

    for(j=0; j<tag_name_list.length; j++){
      node = $(tag_row[j+1]).find('.add_tag_cursor');
      tag_name = tag_name_list[j];
      frames = find_frames(node);
      tag_name_dict[tag_name] = frames;
    }

    $.ajax({
      url: 'http://127.0.0.1:5000/exportdata',
      type: 'POST',
      data: JSON.stringify({data_labels, tag_name_dict}),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      success: function(data) {
        // Hide Spinner
        document.getElementById("spinner").style.display = "none";

        alert("File saved to: " + data.file_name);
      },
      error: function (responseData, textStatus, errorThrown) {
        // Hide Spinner
        document.getElementById("spinner").style.display = "none";

        alert("Sorry! The following error occured: " + errorThrown);
      }
    });

  }

}
