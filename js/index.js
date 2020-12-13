// Set body width to: (width of screen - width of scroll bar)
document.querySelector('body').style.width = window.innerWidth;

// Set all elements not shown before visualize to display = none
document.querySelector('#center_display').style.display = "none";
document.querySelector('#right_details').style.display = "none";
document.querySelector('#right_tag_names').style.display = "none";
document.querySelector('#center_timeframe_layout').style.display = "none";
document.querySelector('#bottom_layout').style.display = "none";

// Single elements used to create list: set to display = none
document.querySelector('.video_block').style.display = "none";
document.querySelector('.line_chart').style.display = "none";
document.querySelector('.stats_player_missing').style.display = "none";
document.querySelector('.stats_player_noise').style.display = "none";
document.querySelector('.zoomed_timeframe_heatmap').style.display = "none";
document.querySelector('.tag_highlight_button').style.display = "none";
document.querySelector('.highlighter').style.display = "none";
document.querySelector('.timeframe_label_row').style.display = "none";
document.querySelector('.timeframe_dropdown_row').style.display = "none";
document.querySelector('.add_tag_row').style.display = "none";
document.querySelector('.combine_video_row').style.display = "none";

// Highlighter not displayed until tag buttons are clicked
document.querySelector('#highlighter_container').style.display = "none";

// Manual Noise Removal not displayed before button click
document.querySelector('#timeframe_manual_noise_removal_row').style.display = "none";

// Disable Export data by default
$('#export_data')[0].disabled = true;

// Disable buttons until set_start is clicked
function disableButtons() {
  node_enable_disable = $('.button_enable_disable');
  for(i=0; i<node_enable_disable.length; i++)
    node_enable_disable[i].disabled = true;
}

// Resize elements when window resizes
// $(window).resize(function() {
//     //setLineChartDimensions();
//     resizeLineChart();
//     resizeHeatMap();
//     resizeTimeline();
//     // resizeZoomedHeatMap();
// });
