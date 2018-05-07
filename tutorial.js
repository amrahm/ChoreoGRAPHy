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

    
    
function showTutorial() {
    // show the tutorial slides
    // then disappear them
    // this will run every time the thing starts since we don't have a backend but ideally would only run once
    //tutorialDiv.style.display = "block";
    tutorialDiv.style.height = "100%";
    tutorialDiv.style.width = "100%";
    backButton.disabled;
    tutorialImage.style.width = "50%";
    tutorialImage.style.height = "50%";
    tutorialImage.style.zIndex = "inherit";
    tutorialDiv.style.zIndex = "1002";
    tutorialDiv.style.backgroundColor = "rgb(238, 238, 238)";
    stageDrawing.style.display = "none";
    tutorialDiv.appendChild(image);
}
    
function hideTutorial() {
    console.log("hiding tutorial");
    tutorialDiv.style.display = "none";
}
    
function nextSlide() {
    console.log("next button clicked");
    currentIndex = currentIndex + 1;
    backButton.disabled = false;
    console.log(currentIndex);
    console.log(size);
    if (currentIndex < size) {
        tutorialImage.src = tutorialSlides[currentIndex]; 
        if (currentIndex === size-1){
            tutorialButton.innerHTML = "Done";
        }
    } else {
        hideTutorial();
    }
}

function previousSlide() {
    console.log("back button clicked");
    tutorialButton.innerHTML = "Next";
    currentIndex = currentIndex - 1;
    tutorialImage.src = tutorialSlides[currentIndex];
    if (currentIndex > 0) {
        backButton.enabled;
    } else {
        backButton.disabled = true;
    }
}

