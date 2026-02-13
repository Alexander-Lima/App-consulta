window.addEventListener('load', () => {
        updateCNPJCounter()
        registerAddArrowClick()
        registerMarkUnmarkAll()
        registerFilterEvents()
        registerHideFiltersMouseOut()
        registerMarkUnmarkDuam()
        registerMarkLicenseSent()
    }
)

function registerHideFiltersMouseOut() {
    const filters = document.querySelectorAll('div[id *= -filter]')

    filters.forEach(filter => {
        filter.addEventListener('mouseleave', () => {
            filter.style.display = "none"
        })
    })
}

function registerAddArrowClick () {
    const arrows = document.querySelectorAll('.arrow')

    arrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const type = arrow.id.split("-")[1]
            toggleStatusFilter(type)
        })
    })
}

function toggleStatusFilter(type) {
    const filteredColumn = document.getElementById(`${type}-filter`)

    filteredColumn.style.display === 'none' ?
        filteredColumn.style.display = 'flex':
        filteredColumn.style.display = 'none'
}

function registerMarkUnmarkAll () {
    const buttons = document.querySelectorAll('.mark-unmark')
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const column = button.parentElement.parentElement.id.split("-")[0]

            const options = document.querySelectorAll(`.${column}-option`)
            const label = document.getElementById(`${column}-mark-unmark-label`)

            if(label.innerHTML === "MARCAR TODOS") {
                options.forEach(option => option.checked = true)
                label.innerHTML = "DESMARCAR TODOS"
            } else {
                options.forEach(option => option.checked = false)
                label.innerHTML = "MARCAR TODOS"
            }
        })
    })
}

function registerFilterEvents () {
    const filterButtons = document.querySelectorAll('[id *= filter-button]')

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterTable()
            updateCNPJCounter()
        })
    })
}

function updateCNPJCounter() {
    const visibleRows = 
        Array.from(document.querySelectorAll('.data-row'))
            .filter(item => item.style.display === "table-row")
    const total = document.querySelector('#cnpjCount')
    total.dataset.totalcnpj= visibleRows.length
}

function filterTable () {
    const rows = document.querySelectorAll('.data-row')
    const noItems = document.getElementById("no-items")
    const selectedoptions =
        Array.from(document.querySelectorAll("[class*='option']"))
            .filter(item => item.checked)
            .map(item => item.value)

    noItems.style.display =  "table-row"

    rows.forEach(row => {
        const municipio = row.children[2].innerHTML
        const status = row.children[4].children[0].children
        
        const filterMunicipio = selectedoptions.includes(municipio)
        let hasStatus = false

        for(item of status) {
            item.style.display = "none"

            if(selectedoptions.includes(item.dataset.status)) {
                item.style.display = "" 
                hasStatus = true
            }
        }

        const filters = [
            filterMunicipio,
            hasStatus
        ]

        const isVisible = filters.some(item => item === false)
        
        if(!isVisible) {
            row.style.display = "table-row"
            noItems.style.display = "none"
        } else {
            row.style.display = "none"
        }
    })
}

async function registerMarkUnmarkDuam() {
    const elements = document.querySelectorAll(".pending")

    elements.forEach(element => {
        element.addEventListener('click', async (event) => {
            const element = event.target
            const id = getParent(element, 3).dataset?.id
            const duam = element.getAttribute("data-duam")
            const isSent = element.classList.contains("sent")
            const body = {id: id, duam: duam}
            
            if(!(id && duam)) return
            const config = {
                method: isSent ? "DELETE" : "POST",
                headers: { "Content-Type" : "Application/json" },
                body: JSON.stringify(body)
            }
            const resp = await fetch("/app-consulta/consulta-ccp", config)
            if(!resp.ok) return 
            if(isSent) element.classList.remove("sent")
            else element.classList.add("sent")
        })
    })
}

async function registerMarkLicenseSent() {
    const elements = document.querySelectorAll(".no-pendencies")

    elements.forEach(element => {
        element.addEventListener('click', async (event) => {
            const element = event.target
            const elementText = element.innerText
            const id = getParent(element, 3).dataset?.id
            const isSent = elementText == "ENVIADO"
           
            const config = {
                method: "PUT",
                headers: { "Content-Type" : "text/html" },
            }
            const resp = await fetch(`/app-consulta/consulta-ccp?id=${id}&licenseSent=${isSent ? "0" : "1"}`, config)
            if(!resp.ok) {
                return console.log(await resp.text())
            }
            element.innerText  = isSent ? "SEM PENDÊNCIAS" : "ENVIADO"
        })
    })
}

function getParent (element, level) {
    let result = element
    for (let i=1; i <= level; i++) {
        result = result.parentElement
    }
    return result
}
