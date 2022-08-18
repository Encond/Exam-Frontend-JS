let headerNavbar = document.getElementById("headerNavbar");

function CheckAndSetAnimations() {
    if (localStorage.getItem("animations") == "false")
        headerNavbar.style.animationName = "none";
};
CheckAndSetAnimations();