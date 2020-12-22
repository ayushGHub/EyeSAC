function remove_manual_noise_removal_row() {
  // Clear selections of cursor
  cursor_nodes = $('.noise_removal_cursor');
  for(i=1; i<cursor_nodes.length; i++)
    cursor_nodes[i].remove();

  // Hide  entire add_tag_row
  document.querySelector('#timeframe_manual_noise_removal_row').style.display = "none";

  // Change top margin of vertical line
  document.querySelector('#vertical_line_container').style.marginTop = "0.1%";

  // Change top margin of highlighter
  document.querySelector('#highlighter_container').style.marginTop = "0.1%";
}

function add_manual_noise_removal_cursor(add_node){
  node = add_node.parentNode.parentNode.querySelector('#manual_noise_removal_cursor')
  cursor_node = node.querySelector('.noise_removal_cursor')
  copy = cursor_node.cloneNode(true);
  cursor_node.parentNode.insertBefore(copy, cursor_node);
  cursor_node.style.display = "inline-block";

  $('.noise_removal_cursor').each(function() {
      var $this = $(this);
      $this.resizable({
          grid: [1, 10000],
          containment: "parent",
          handles: { 's': $this.find("div.ui-resizable-handle") }
      });
  });
  $('.noise_removal_cursor').draggable({axis:"x", containment:"parent"});
}

$('.noise_removal_cursor').resizable({
    grid: [1, 10000]
});

function remove_manual_noise_cursor(node){

    if ($('.noise_removal_cursor').length > 2){
      divNode = node.parentNode;
      divNode.remove();
    }

    else{
      alert("Atleast one cursor is required");
    }
}

function find_manual_noise_frames(node) {

  nodewidth = node.getBoundingClientRect().width;
  node_left = node.getBoundingClientRect().left;
  frame_width = nodewidth/total_frames;

  cursors = $(node).find('.noise_removal_cursor');

  // cursors = node.childNodes;

  output = []
  for(i=1; i<cursors.length; i++){

    cursor_left = parseInt((cursors[i].getBoundingClientRect().left - node_left)/frame_width);
    cursor_right = parseInt((cursors[i].getBoundingClientRect().right - node_left)/frame_width);
    output.push([cursor_left, cursor_right]);

  }

  return output;
}

function clean_noise_manually() {

  node = document.querySelector('#manual_noise_removal_cursor');
  frames_to_clean = find_manual_noise_frames(node);
  clearNoise(frames_to_clean);

}
