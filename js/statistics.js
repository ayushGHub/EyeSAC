// Data files
data_count = 0;
data_sources = [];
data_labels = [];
frame_start = 0;
total_frames = 0;

// Replicate Stat Rows
function multiplyStatsRow(node, count, deep) {

    className = node.className;
    var tr_value = className.split("_")[2];
    var value = "";
    if(tr_value=="noise")
      value = "Noise";
    else
      value = "Missing";

    for (var i = 1, copy; i <= count; i++) {
        copy = node.cloneNode(deep);
        node.parentNode.insertBefore(copy, node);

        node.style.display = "table-row";
        node.id = className + "_" + i;
        node.querySelector('.stats_table_col1').innerHTML
          = "Player " + i + ": " + value;
        node.querySelector('.stats_table_col2').id = tr_value + "_" + i;
    }
}

// Alternate table row colors
function altTableRows()
{
    var rows = $("#stats table tr");
    var odd = true;
    for(var i = 1; i < rows.length; i++) {

        if(rows[i].style.display=="none")
          continue;

        if(odd)
            rows[i].style.backgroundColor = "white" ;
        else
            rows[i].style.backgroundColor = "#a9a9a9" ;

        odd = !odd;
    }
}

// For Stats
const type_stats = (d) => {
  return {
    cat: d.Category,
    val: d.Value
  };
};

function displayStats() {

  // Read TSV for stats
  d3.tsv("generated_files\\stats.tsv", type_stats, (error, data) => {
  	  stats_data = data;

      index = 0;

      document.getElementById("stats_total_frames").innerHTML = stats_data.slice(index, index+1).map(function(d){return d.val});

      nodes = $(".stats_player_missing")
      for(j=1; j<nodes.length; j++)
        nodes[j].querySelector('.stats_table_col2').innerHTML = stats_data.slice(++index, index+1).map(function(d){return d.val});

      document.getElementById("noise_threshold_text").value = stats_data.slice(++index, index+1).map(function(d){return d.val});

      nodes = $(".stats_player_noise")
      for(j=1; j<nodes.length; j++)
        nodes[j].querySelector('.stats_table_col2').innerHTML = stats_data.slice(++index, index+1).map(function(d){return d.val});
  });
}

// Validate noise threshold value
// var RegExp = new RegExp(/^\d*\.?\d*$/);
function validateFloat(elem) {
    val = elem.value;
    // (!RegExp.test(val)) ||
    if (val<0 || val>1) {
        alert("Only float numbers between 0 and 1 allowed!");
        elem.value = 0.5;
    }
}

// For Stats update
function set_values_right_details(d_count, d_sources, d_labels, f_start, t_frames) {
  data_count = d_count;
  data_sources = d_sources;
  data_labels = d_labels;
  frame_start = f_start;
  total_frames = t_frames;
}

function updateNoiseThreshold(node) {

  // Get noise threshold value
  noise_threshold = node.parentNode.querySelector('#noise_threshold_text').value;

  if(noise_threshold!='') {

    // Display Spinner
    document.getElementById("spinner").style.display = "block";

    noise_threshold = parseFloat(noise_threshold);
    caller = "update_noise_threshold";

    // Generate timeframe, stats and line chart files
    $.ajax({
      url: 'http://127.0.0.1:5000/generate_data',
      type: 'POST',
      data: JSON.stringify({data_sources, data_labels, noise_threshold, frame_start, total_frames, caller}),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      success: function(data) {

        // Display Statistics
        displayStats();

        // Display timeframe
        multiplyPlayerHeatmap('.timeframe_heatmap', data_count, data_labels, frame_start, total_frames);

        // Update heatmap for visualization if already present
        node = $('.timeframe_dropdown_row');
        for(i=1; i<node.length; i++)
          updateVisualizationHeatmap(node[i].querySelector('select'));

        // Display zoomed timeframe


        // Hide Spinner
        document.getElementById("spinner").style.display = "none";
      }
    });
  } else
    alert("Enter a value to update noise threshold!");
}
