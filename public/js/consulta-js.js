document.body.onload = function () {
    viewPaid()
    getPendencies()
    updateCurrentItem()
    addArrowClick()
    applyFilter()
    markUnmarkAll()
}

function viewPaid () {
    let elements = document.querySelectorAll(".pago")

    elements.forEach(element => {
        element.addEventListener('click', event => {
            let barcode = event.target.getAttribute('data-barcode');
            let url= `https://arr.economia.go.gov.br/arr-www/view/exibeDARE.jsf?codigo=${barcode}`
            window.open(url)
        })
    })
}

function getPendencies () {
    let elements = document.querySelectorAll(".vencido, .vencer-mes, .vencer-futuro")

    elements.forEach(element => {
        element.addEventListener('click', event => {
           window.open("https://sicabom.bombeiros.go.gov.br/public/pages/index.php#")
        })
    })
}

function updateCurrentItem () {
    let buttons = document.querySelectorAll(".update")

    buttons.forEach(button => {
        button.addEventListener('click', async (event) => {
            let cnpjButton = event.target.parentElement.getAttribute("data-cnpj")

            let resp = await fetch(`/consulta-individual?cnpj=${cnpjButton}`, {
                method: "POST",
                headers: {"Content-Type" : "Application/json"}
            })

            if (!resp.ok) return
            generateNewStatus(cnpjButton, await resp.json())
            
        })
    })
}

function generateNewStatus (cnpjButton, response) {
    let statusElement = document.getElementById(cnpjButton)
    let childs = generateItems(response)

    statusElement.innerHTML = ""
    childs.forEach(child => statusElement.appendChild(child))
}

function generateItems (objArray) {
    let childs = []

    if (!(objArray instanceof Array)) {
        let li = document.createElement("li")
        let span = document.createElement("span")
        
        if(objArray.SEM_REGISTRO) {
            li.className = "no-register"
            span.innerHTML = "SEM REGISTRO"
            
        } else if (objArray.FALHOU) {
            li.className = "failure"
            span.innerHTML = "FALHA AO BUSCAR DADOS"
        }
        li.style.display = "block"
        li.appendChild(span)
        childs.push(li)

    } else if(objArray instanceof Array) {
        for(obj of objArray) {
            let li_array = document.createElement("li")
            let span_array = document.createElement("span")

            li_array.style.display = "block"
            span_array.setAttribute("data-title", obj.DATA_VENCIMENTO)
            span_array.innerHTML = obj.ANO_PRESTACAO

            if(obj.SITUACAO === "PAGO") {
                span_array.setAttribute("data-barcode", obj.REGISTRO_CODIGO_BARRAS)
                li_array.className = "pago"

            } else if(obj.SITUACAO === "ISENTO") {
                span_array.setAttribute("data-barcode", obj.REGISTRO_CODIGO_BARRAS)
                li_array.className = "pago"

            } else if (obj.SITUACAO) {
                let itemDateArray = obj.DATA_VENCIMENTO.split("/");
                let formatedDate = itemDateArray[2] + "-" + itemDateArray[1] + "-" + itemDateArray[0];
                let milisecondsDay = 2592000000
                const itemDate = new Date(formatedDate + "T00:00:00.000Z");
                const today = new Date().getTime()
            
                if (itemDate - today < 0) { li_array.className = "vencido"}
                else if (itemDate - today < milisecondsDay) {li_array.className = "vencer-mes"}
                else {li_array.className = "vencer-futuro"} 
            }
            li_array.appendChild(span_array)
            childs.push(li_array)
        }
    }
    return childs
}

function addArrowClick () {
    let arrowButton = document.getElementById('arrow')

    arrowButton.addEventListener('click', () => {toggleStatusFilter()})
}

function toggleStatusFilter () {
    let filter = document.getElementById('status-filter')

    filter.style.display === 'none' ?
        filter.style.display = 'flex':
        filter.style.display = 'none'
}

function applyFilter () {
    let filterButton = document.getElementById('filter')

    filterButton.addEventListener('click', () => {
        let options = document.getElementsByClassName('option')
        let filterShowOptions = []
        let filterHideOptions = []
         
        for (option of options) {option.checked ? filterShowOptions.push(option.value) : filterHideOptions.push(option.value)}

        filterShow(filterShowOptions)
        filterHide(filterHideOptions)
        verifyRowVisibility()
        toggleStatusFilter()
    })
}

function filterShow (options) {
    if (!options) return
    options.map(filterShowOption => {
        let elementsFiltered = document.querySelectorAll(`.${filterShowOption}`)
        elementsFiltered.forEach(element => element.style.display = "block")
    })
}

function filterHide (options) {
    if (!options) return 
    options.map(filterHideOption => {
        let elementsFiltered = document.querySelectorAll(`.${filterHideOption}`)
        elementsFiltered.forEach(element => element.style.display = "none")
    }) 
}

function verifyRowVisibility () {
    let rows = document.getElementsByClassName('cnpj')
    let noItemsDiv = document.getElementById('no-items')
    let noItemsMessage = true

    for (row of rows) {
        let statusYearsList = row.children[2].children[0].children
        let visible = false

        for(item of statusYearsList) {if(item.style.display !== "none") {visible = true; break;}}
        if(!visible) {row.style.display = "none"; continue}
        row.style.display = "flex"
        noItemsMessage = false
    }

    noItemsMessage ? noItemsDiv.style.display = "flex" : noItemsDiv.style.display = "none"
}

function markUnmarkAll () {
    let button = document.getElementById('mark-unmark')
    
    button.addEventListener('click', () => {
        let options = document.querySelectorAll('.option')
        let label = document.getElementById('mark-unmark-label')
        
        label.innerHTML === "MARCAR TODOS" ? 
            options.forEach(option => option.checked = true) :
            options.forEach(option => option.checked = false)

        label.innerHTML === "DESMARCAR TODOS" ? label.innerHTML = "MARCAR TODOS" : label.innerHTML = "DESMARCAR TODOS"
    })
}



