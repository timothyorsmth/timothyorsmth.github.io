// Lock screen toggle handler
document.getElementById('startExperience').addEventListener('click', () => {
    console.log('Lock screen hidden, desktop visible');
    document.getElementById('welcomeScreen').classList.add('hidden');
});

$("#startExperience").on( "mouseenter", function() {
    
});

function randomiseElementPositions(element) {
    // Randomise the element's position and rotation
    const randomX = Math.random() * 10 - 5;
    const randomY = Math.random() * 10 - 5;
    const randomRotation = Math.random() * 10 - 5;
    element.style.transform = "translate(" + randomX + "px, " + randomY + "px) rotate(" + randomRotation + "deg)";
}

// Randomise all letters in the "HELLO" text on the welcome screen
const helloLetters = document.querySelectorAll('#helloLetters img');
helloLetters.forEach(letter => {
    randomiseElementPositions(letter);
    
    // Move on hover
    letter.addEventListener('mouseenter', () => {
        randomiseElementPositions(letter);
    });

    
});

