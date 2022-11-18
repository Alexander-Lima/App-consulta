document.body.onload = function () {
    addArrowClick()
    markUnmarkAll()
    applyFilter()
    hideFiltersMouseOut()
    updateCounters()
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
    let filterButtons = document.querySelectorAll('[id *= filter-button]')

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            let type = button.id.split("-")[0]
            let options = document.querySelectorAll('input[class*="-option"]')
            let filterShowOptions = []
            for (option of options) { if(option.checked) filterShowOptions.push(option.value) }
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
