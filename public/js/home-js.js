document.body.onload = function () {
    handleClickCards()
}

function handleClickCards () {
    let cards = document.querySelectorAll(".card")

    cards.forEach(item => {
        item.addEventListener('click', async event => {
            let href = event.target.parentElement.getAttribute('data-href');
            let progressBarOverlay = document.getElementById("overlay")

            progressBarOverlay.style.display= "flex"
            window.location = href
        })
    })
}