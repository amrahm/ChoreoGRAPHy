var tutorialSlides = [
    "tutorial_drawing.png",
    "tutorial_dancers.png",
    "tutorial_formations.png",
    "tutorial_groups.png"
]

let tutorialDiv = document.getElementById("tutorial");
let tutorialImage = document.getElementById("tutorialImage");
let tutorialButton = document.getElementById("tutorialButton");
let backButton = document.getElementById("backButton");
let stageDrawing = document.getElementById("notTutorial");
var size = this.tutorialSlides.length;
var currentIndex = 0;

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
            tutorialButton.innerHTML = "Done";
        }
    } else {
        hideTutorial();
    }
}

function previousSlide() {
    // console.log("back button clicked");
    tutorialButton.innerHTML = "Next";
    currentIndex--;
    tutorialImage.style.setProperty("background-image", `url(${tutorialSlides[currentIndex]})`);
    // console.log(currentIndex);
    if (currentIndex > 0) {
        backButton.enabled;
    } else {
        backButton.disabled = true;
    }
}

