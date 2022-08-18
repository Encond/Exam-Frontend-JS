import { LoadMainContent } from "./index.js"

const main = document.querySelector("main");
const divAnimations = document.getElementById("divAnimations");
const container = document.querySelector(".container");
const inputCheckboxAnimations = document.getElementById("inputCheckboxAnimations");

const headerNavbar = document.getElementById("headerNavbar");
const divHealthBar = document.getElementById("divHealthBar");
const canvasGame = document.getElementById("canvasGame");

function SetDefaultValues() {
    document.querySelector("div[class='animate three']").style.margin = 0;
};
SetDefaultValues();

function CheckAndSetAnimations() {
    if (localStorage.getItem("animations") == "false")
        inputCheckboxAnimations.checked = false;
    else
        inputCheckboxAnimations.checked = true;
};
CheckAndSetAnimations();

buttonGuide.addEventListener("click", function () {
    main.style.display = "block";
    divAnimations.style.display = "none";
    container.style.display = "none";

    let tempTimeoutForTimer = 6000;
    if (inputCheckboxAnimations.checked == false) {
        divHealthBar.style.animationName = "none";
        headerNavbar.style.animationName = "none";
        canvasGame.style.animationName = "none";
        tempTimeoutForTimer = 0;
    }

    localStorage.setItem("animations", inputCheckboxAnimations.checked);

    LoadMainContent(tempTimeoutForTimer);
});