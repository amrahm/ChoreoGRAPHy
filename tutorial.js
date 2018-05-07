var tutorialSlides = [
    "tutorial/StageDrawing.gif",
    "tutorial/DancerHelp.gif",
    "tutorial/TimelineHelp.gif",
    "tutorial/GroupsHelp.gif"
]

let tutorialDiv = document.getElementById("tutorial");
let tutorialImage = document.getElementById("tutorialImage");
let nextButton = document.getElementById("nextButton");
let backButton = document.getElementById("backButton");
let stageDrawing = document.getElementById("notTutorial");
var size = this.tutorialSlides.length;
var currentIndex = 0;

function showTutorial(index) {
    currentIndex = index - 1;
    this.nextSlide();
    tutorialDiv.style.display = "grid";    
}

function hideTutorial() {
    // console.log("hiding tutorial");
    tutorialDiv.style.display = "none";
}

function nextSlide() {
    // console.log("next button clicked");
    currentIndex++;
    backButton.disabled = false;
    // console.log(size);
    if (currentIndex < size) {
        tutorialImage.style.setProperty("background-image", `url(${tutorialSlides[currentIndex]})`);
        // console.log(currentIndex);
        if (currentIndex === size - 1) {
            nextButton.innerHTML = "Done";
        }
    } else {
        hideTutorial();
    }
}

function previousSlide() {
    // console.log("back button clicked");
    nextButton.innerHTML = "Next";
    currentIndex--;
    tutorialImage.style.setProperty("background-image", `url(${tutorialSlides[currentIndex]})`);
    // console.log(currentIndex);
    if (currentIndex > 0) {
        backButton.enabled;
    } else {
        backButton.disabled = true;
    }
}

