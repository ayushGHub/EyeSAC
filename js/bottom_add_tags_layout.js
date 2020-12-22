// On view tags toggle button
function view_tags() {

  // Hide combine_video_layout and show add_tags_layout
  document.querySelector('#combine_video_layout').style.display = "none";
  document.querySelector('#add_tags_layout').style.display = "inline-block";

  // Set toggle buttons active class
  document.querySelector('#view_tags_btn').classList.remove("active");
  document.querySelector('#view_combine_video_btn').classList.remove("active");
  document.querySelector('#view_tags_btn').classList.add("active");
}

function remove_tag(node) {
  // Remove tag by removing entire add_tag_row
  current_node = node.parentNode.parentNode
  current_node_id = current_node.id.split("_")[2];
  current_node.remove();
  remove_tag_button(current_node_id);
}

//Function to replicate cursors in one row
function add_tag_cursor(add_node){
  node = add_node.parentNode.parentNode.querySelector('.add_tag_cursor')
  cursor_node = node.querySelector('.tag_cursor')
  copy = cursor_node.cloneNode(true);
  cursor_node.parentNode.insertBefore(copy, cursor_node);
  cursor_node.style.display = "inline-block";

  $(".tag_cursor").draggable({axis:"x", containment:"parent"});
  $(".tag_cursor").each(function() {
      var $this = $(this);
      $this.resizable({
          grid: [1, 10000],
          containment: "parent",
          handles: { 's': $this.find("div.ui-resizable-handle") }
      });
  });
}

function remove_tag_cursor(node){

  if ($(node.parentNode.parentNode).find($('.tag_cursor')).length > 2)
  {
    divNode = node.parentNode;
    divNode.remove();
  }

  else{
    alert("Atleast one cursor is required")
  }
}
