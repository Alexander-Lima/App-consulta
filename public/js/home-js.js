window.addEventListener("load", event => {
    handleClickCards()
})

window.addEventListener("pagehide", event => {
    toggleOverlay(false);
})

function handleClickCards () {
    const cards = document.querySelectorAll(".card")

    cards.forEach(item => {
        item.addEventListener('click', async event => {
            toggleOverlay(true);
        })
    })
}

function toggleOverlay(show) {
    const progressBarOverlay = document.getElementById("overlay")

    if(!progressBarOverlay) {
        return;
    }

    progressBarOverlay.style.display= show ? "flex" : "none"
}