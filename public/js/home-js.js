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
            
            switch(href) {
                case "/consulta-tpi":
                case "/consulta-ccp":
                    let progressBar = document.getElementById("progress-bar")
                    progressBar.style.display= "flex"

                    
                    const resp = await fetch(`count-empresas?origin=${href}`, {method: "GET", headers: {"Content-Type" : "Application/json"}})

                    if(!resp) {alert("Falha ao buscar dados!"); return}
                    const {["COUNT(ID)"] : count} = await resp.json()

                    moveProgressbar(count, href)
                    break;

                case "/cnpjs-crud":
                    let spinner = document.getElementById("spinner")
                    spinner.style.display= "flex"
                    break;
            }
            window.location = href

        })
    })
}

function moveProgressbar (count, href) {
    console.log(count)
    const msProcessingTimeForEach = href === "/consulta-tpi" ? 650 : 100
    const progressBarTicksInterval = count / 100 * msProcessingTimeForEach
    const bar = document.getElementById("bar")
    const completion = document.getElementById('completion')

    const timer = setInterval(() => {
        let currentWidth = Number(bar.style.width.replace("%", ""))
        let newWidth = currentWidth + 1
        
        if(currentWidth >= 100) {clearInterval(timer); return}
        completion.innerHTML = newWidth + "%"
        bar.style.width = newWidth + "%"
    }
    , progressBarTicksInterval)
}