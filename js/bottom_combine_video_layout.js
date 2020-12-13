video_sources = []

// Replicate each combine_video_row
function multiplyCombineVideoNode(node, count, deep, labels, sources) {

    video_sources = sources;

    for (var i = 0, copy; i < count; i++) {
        copy = node.cloneNode(deep);
        node.parentNode.insertBefore(copy, node);

        node.style.display = "inline-block";
        node.id = "combine_video_"+ labels[i];   // Added node
        label = node.querySelector('.combine_video_label');
        label.querySelector('.label').value = labels[i];
    }
}

function add_combine_video_cursor(add_node){
  node = add_node.parentNode.parentNode.querySelector('.combine_video_cursor');
  cursor_node = node.querySelector('.video_cursor')
  copy = cursor_node.cloneNode(true);
  cursor_node.parentNode.insertBefore(copy, cursor_node);
  cursor_node.style.display = "inline-block";

  $('.video_cursor').resizable({
            grid: [1, 10000]
  });
  $('.video_cursor').draggable({axis:"x", containment:"parent"});

}

function remove_video_cursor(node){

    if ($('.video_cursor').length > 1){
      divNode = node.parentNode;
      divNode.remove();
    }

    else {
      alert("Atleast one cursor is required");
    }
}

// On combine video toggle button
function view_combine_video() {

  // Hide add_tags_layout and show combine_video_layout
  document.querySelector('#add_tags_layout').style.display = "none";
  document.querySelector('#combine_video_layout').style.display = "inline-block";

  // Set toggle buttons active class
  document.querySelector('#view_tags_btn').classList.remove("active");
  document.querySelector('#view_combine_video_btn').classList.remove("active");
  document.querySelector('#view_combine_video_btn').classList.add("active");
}



function combine_video() {

  vi_cursor_row = $('.combine_video_row');

  video_name_dict = {};


    // Display Spinner
  document.getElementById("spinner").style.display = "block";

  for(j=1; j<vi_cursor_row.length; j++){

    node = $(vi_cursor_row[j]).find('.combine_video_cursor');
    id = $(vi_cursor_row[j]).attr('id').split('_')[2];
    console.log(id);
    video_source = video_sources[j-1];
    video_frames = find_video_frames(node, id);
    video_name_dict[video_source] = video_frames;

  }
  console.log(video_name_dict);

  console.log(video_name_dict);

  console.log(video_sources);


  $.ajax({
    url: 'http://127.0.0.1:5000/combinevideo',
    type: 'POST',
    data: JSON.stringify({video_name_dict, video_sources}),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    success: function(data) {
      // Hide Spinner
      document.getElementById("spinner").style.display = "none";

      // alert("File saved to: " + data.file_name);
    },
    error: function (responseData, textStatus, errorThrown) {
      // Hide Spinner
      document.getElementById("spinner").style.display = "none";

      alert("Sorry! The following error occured: " + errorThrown);
    }
  });



}
