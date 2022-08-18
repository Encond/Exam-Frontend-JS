let tableTbody = document.getElementById("tableTbody");
let headerNavbar = document.getElementById("headerNavbar");
let buttonClearHistory = document.getElementById("buttonClearHistory");

function CheckAndSetAnimations() {
    if (localStorage.getItem("animations") == "false")
        headerNavbar.style.animationName = "none";
};
CheckAndSetAnimations();

function GetFromStorage() {
    for (let i = 0; i < localStorage.length + 1; i++) {
        let item = localStorage.getItem(i);

        if (item != null) {
            let splittedItem = item.split('|');

            tableTbody.innerHTML += `
            <tr>
            <td>${splittedItem[1]}</td>
            <td>${splittedItem[2]}</td>
            <td>${splittedItem[0]}</td>
            <td>${splittedItem[3]}</td>
            <td>${splittedItem[4]}</td>
            </tr>
            `;
        }
    }
};
GetFromStorage();

buttonClearHistory.addEventListener("click", () => {
    const animations = localStorage.getItem("animations");
    localStorage.clear();
    localStorage.setItem("animations", animations);
    
    location.reload();
});