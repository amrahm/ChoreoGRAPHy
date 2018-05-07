var tutorialSlides = [
    "tutorial_groups.png"
    // etc
    ]

let tutorialDiv = document.getElementById("tutorial");
let tutorialButton = document.getElementById("tutorialButton");
let backButton = document.getElementById("tutorialBackButton");
let stageDrawing = document.getElementById("notTutorial");
var size = this.tutorialSlides.length;
var currentIndex = 0;

    
    
function showTutorial() {
    // show the tutorial slides
    // then disappear them
    // this will run every time the thing starts since we don't have a backend but ideally would only run once
    //tutorialDiv.style.display = "block";
    tutorialDiv.style.position = "absolute";
    tutorialDiv.style.zIndex = "1000";
    tutorialDiv.style.height = "100%";
    tutorialDiv.style.width = "100%";
    tutorialDiv.setAttribute("background-image", tutorialSlides[currentIndex]); 
    stageDrawing.style.display = "none";
}
    
function hideTutorial() {
    console.log("hiding tutorial");
    tutorialDiv.style.display = "none";
}
    
function nextSlide() {
    console.log("next button clicked");
    currentIndex = currentIndex + 1;
    console.log(currentIndex);
    if (currentIndex < size) {
        tutorialDiv.style.backgroundImage = tutorialSlides[currentIndex]; 
    } else {
        hideTutorial();
    }
}

function previousSlide() {
    console.log("back button clicked");
    currentIndex = currentIndex - 1;
    if (ind > 0) {
        backButton.enabled = "true";
    } else {
        backButton.enabled = "false";
    }
}

