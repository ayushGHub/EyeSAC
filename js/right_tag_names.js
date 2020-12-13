var active_highlight_button_id = "";

// Change text of highlight button based on tag label
function change_button_value(node) {
  // Get value of tag_label
  var value = node.value;

  // Find add_tag_row and get it's id
  current_node = node.parentNode.parentNode;
  current_node_id = current_node.id.split("_")[2];

  // Update tag_button with same id to value of tag_label
  $('#tag_button_'+current_node_id).find('input').val(value);
}

// Remove highlight button if tag is deleted
function remove_tag_button(current_node_id) {
  // Remove tag by removing entire add_tag_row
  current_node = document.querySelector('#tag_button_'+current_node_id);
  current_node.remove();

  // If highlight of this node is active, remove highlight
  if(active_highlight_button_id == ('tag_button_'+current_node_id)) {
    remove_highlight_heatmap();
    active_highlight_button_id = "";
  }
}

// Onclick, highlight or remove highlight of button based on current state
function highlight_button_clicked(node) {

  // If no highlight is on, highlight clicked node
  if(active_highlight_button_id == "") {

    active_highlight_button_id = node.parentNode.id;
    tag_label_id = "tag_label_" + active_highlight_button_id.split("_")[2];
    cursor_parent_node = document.querySelector('#'+tag_label_id).querySelector('.add_tag_cursor');
    frames = find_tag_frames(cursor_parent_node);

    highlight_heatmap(frames);

    node.classList.add("active");

  }

  // If currently clicked node is highlight, remove highlight
  else if(active_highlight_button_id == node.parentNode.id) {

    active_highlight_button_id = "";
    remove_highlight_heatmap();
    node.classList.remove("active");

    node.parentNode.class = "tag_highlight_button"
  }

  // If clicked node is different from currently highlighted node,
  // remove current highlight and put new highlight
  else {

    remove_highlight_heatmap();

    // Below line gives issues
    document.querySelector('#' + active_highlight_button_id).querySelector("input").classList.remove("active");

    active_highlight_button_id = node.parentNode.id;
    tag_label_id = "tag_label_" + active_highlight_button_id.split("_")[2];
    cursor_parent_node = document.querySelector('#'+tag_label_id).querySelector('.add_tag_cursor');
    frames = find_tag_frames(cursor_parent_node);

    highlight_heatmap(frames);

    node.classList.add("active");

  }
}

// Find frame numbers of cursors for given tag id
function find_tag_frames(node) {

  nodewidth = node.getBoundingClientRect().width;
  node_left = node.getBoundingClientRect().left;
  frame_width = nodewidth/total_frames;

  cursors = $(node).find('.tag_cursor');

  // cursors = node.childNodes;

  output = []
  for(i=1; i<cursors.length; i++){

    cursor_left = parseInt((cursors[i].getBoundingClientRect().left - node_left)/frame_width);
    cursor_width = parseInt($(cursors[i]).width()/frame_width);
    output.push([cursor_left, cursor_width]);

  }

  return output;
}

// Highlight heatmap based on frames numbers returned
function highlight_heatmap(frames) {

  // Make highlighter_container visible
  document.querySelector('#highlighter_container').style.display = "block";

  // Find original node
  node = $('.highlighter')[0];

  for(i = 0; i<frames.length; i++) {

    // Duplicate highlighter node
    copy = node.cloneNode(true);
    node.parentNode.insertBefore(copy, node);

    // Make highlighter visible
    node.style.display = "block";

    start = frames[i][0];
    width = frames[i][1];

    node.style.marginLeft = (gridWidth * start) + "px";
    node.style.width = (gridWidth * width) + "px";

    node = copy;
  }
}

// Remove highlighting of heatmap
function remove_highlight_heatmap() {

  // Hide
  document.querySelector('#highlighter_container').style.display = "none";

  // Remove all highlighters
  node = $('.highlighter');
  for(i = 1; i<node.length; i++)
    node[i].remove();
}
