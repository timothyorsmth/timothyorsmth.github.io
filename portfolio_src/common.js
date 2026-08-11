// cursor 
// Start the mouse as hidden so it doesn't appear randomly on the screen
$("#cursor").show();
hideAllCursors();
$("#defaultCursor").show();

// array of all items
function hideAllCursors()
{
    $("#defaultCursor").hide();
    $("#clickCursor").hide();
}

// Update cursor position on mouse move
document.addEventListener("mousemove", (e) => {

    $("#cursor").show().css({
        left: (e.clientX - cursor.offsetWidth / 2) + "px",
        top: (e.clientY - cursor.offsetHeight / 2) + "px"
    });
});

// Hide cursor when mouse leaves the window
document.addEventListener("mouseout", () => {
    $("#cursor").hide();
});


$( "button" ).on( "mouseenter", function() {
    hideAllCursors();
    $("#clickCursor").show();

    console.log("on button");
});

$( "button" ).on( "mouseleave", function() {
    hideAllCursors();
    $("#defaultCursor").show();

    console.log("leave button");
});