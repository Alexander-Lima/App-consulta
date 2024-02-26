document.body.onload = function () {
    addArrowClick()
    markUnmarkAll()
    applyFilter()
    hideFiltersMouseOut()
    updateCounters()
    markUnmarkDuam()
    markLicenseSent()
}

function hideFiltersMouseOut() {
    const filters = document.querySelectorAll('div[id *= -filter]')
    filters.forEach(filter => {
        filter.addEventListener('mouseleave', () => {
            filter.style.display = "none"
        })
    })
}

function addArrowClick () {
    const arrows = document.querySelectorAll('.arrow')

    arrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const type = arrow.id.split("-")[1]
            toggleStatusFilter(type)
        })
    })
}

function toggleStatusFilter(name) {
    let filteredColumn = document.getElementById(`${name}-filter`)

    filteredColumn.style.display === 'none' ?
        filteredColumn.style.display = 'flex':
        filteredColumn.style.display = 'none'
}

function markUnmarkAll () {
    let buttons = document.querySelectorAll('.mark-unmark')
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const column = button.parentElement.parentElement.id.split("-")[0]

            let options = document.querySelectorAll(`.${column}-option`)
            let label = document.getElementById(`${column}-mark-unmark-label`)

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

function applyFilter () {
    const filterButtons = document.querySelectorAll('[id *= filter-button]')

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.id.split("-")[0]
            const options = document.querySelectorAll('input[class*="-option"]')
            const filterShowOptions = []
            for (option of options) if(option.checked) filterShowOptions.push(option.value)
            filterTable(filterShowOptions)
            updateCounters()
            toggleStatusFilter(type)
        })
    })
}

function updateCounters() {
    updateCNPJCounter()
    updateStatusCounter()
}

function updateCNPJCounter() {
    const visibleRows = document.querySelectorAll('.row[style*="display: table-row;"]')
    const total = document.querySelector('.th-left')
    total.dataset.totalcnpj= visibleRows.length
}

function updateStatusCounter() {
    const visibleStatus = document.querySelectorAll('.row[style*="display: table-row"] > td > .status-years > li[style*="display: flex;"]')
    const total = document.querySelector('.th-right')
    total.dataset.totalstatus= visibleStatus.length
}

function filterTable (options) {
    const rows = document.querySelectorAll('.row');
    const noItems = document.getElementById("no-items")
    noItems.style.display =  "table-row"

    rows.forEach(row => {
        const municipio = row.children[2].innerHTML
        const status = row.children[3].children[0].children
        const filterMunicipio = options.includes(municipio)
        let hasStatus = false
        let filters = []

        for(item of status) {
            item.style.display = "none"
            const itemClassName = item.className.split(" ")[0] 
            if(options.includes(itemClassName)) {
                item.style.display = "flex" 
                hasStatus = true
            }
        }

        filters = [
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

async function markUnmarkDuam() {
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
            const resp = await fetch("/consulta-ccp", config)
            if(!resp.ok) return 
            if(isSent) element.classList.remove("sent")
            else element.classList.add("sent")
        })
    })
}

async function markLicenseSent() {
    const elements = document.querySelectorAll(".no-pendencies")

    elements.forEach(element => {
        element.addEventListener('click', async (event) => {
            const element = event.target
            const elementText = element.innerText
            const id = getParent(element, 3).dataset?.id
            const isSent = elementText == "ENVIADO"
           
            const config = {
                method: "POST",
                headers: { "Content-Type" : "text/html" },
            }
            const resp = await fetch(`/consulta-ccp/set-license-sent?id=${id}&status=${isSent ? "0" : "1"}`, config)
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
