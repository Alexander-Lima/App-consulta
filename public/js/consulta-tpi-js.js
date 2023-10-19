document.body.onload = function () {
    viewPaid()
    updateCurrentItem()
    addArrowClick()
    applyFilter()
    markUnmarkAll()
    markUnmarkYear()
    hideFiltersMouseOut()
    updateCounters()
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

function updateCurrentItem () {
    let buttons = document.querySelectorAll(".update")

    buttons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const parent = getParent(event.target, 5)
            const CNPJ = parent.getAttribute("id")
            const id = parent.dataset.id

            const resp = await fetch(`/consulta-tpi/individual?id=${id}&cnpj=${CNPJ}`, {
                method: "POST",
                headers: {"Content-Type" : "Application/json"}
            })
            if (!resp.ok) return

            generateNewStatus(id, await resp.json())
            viewPaid()
            markUnmarkYear()
        })
    })
}

function generateNewStatus (id, response) {
    let statusElement = document.getElementById(id)
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
        li.style.display = "inline-flex"
        li.appendChild(span)
        childs.push(li)

    } else {
        for(obj of objArray) {
            const { 
                SITUACAO,
                DATA_VENCIMENTO,
                ANO_PRESTACAO,
                REGISTRO_CODIGO_BARRAS,
                VALOR_TOTAL,
                SENT
            } = obj
            
            if(SENT) continue
            let li_array = document.createElement("li")
            let span_array = document.createElement("span")
            const inconsistent = VALOR_TOTAL == -1
            
            li_array.style.display = "inline-flex"
            if(inconsistent) {
                span_array.innerHTML = "DADOS INCONSISTENTES"
                li_array.classList.add("inconsistent")
                li_array.appendChild(span_array)
                childs.push(li_array)
                break;
            }
            span_array.setAttribute("data-title", DATA_VENCIMENTO)
            span_array.innerHTML = ANO_PRESTACAO
            
            if(SITUACAO === "PAGO" || SITUACAO === "ISENTO") {
                span_array.setAttribute("data-barcode", REGISTRO_CODIGO_BARRAS)
                li_array.className = SITUACAO === "PAGO" ? "pago" : "ISENTO"    
            } else if(SITUACAO) {
                const sentYearsObj = objArray.filter(item => item.SENT)
                const sentYearsArray = sentYearsObj[0] ? sentYearsObj[0].SENT : false
                const isSentYear = sentYearsArray ? sentYearsArray.includes(ANO_PRESTACAO)  : false
                const itemDateArray = DATA_VENCIMENTO.split("/");
                const formatedDate = itemDateArray[2] + "-" + itemDateArray[1] + "-" + itemDateArray[0];
                const milisecondsDay = 2592000000
                const itemDate = new Date(formatedDate + "T00:00:00.000Z");
                const today = new Date().getTime()
                
                if (itemDate - today < 0) {li_array.className = isSentYear ? "vencido sent" : "vencido"}
                else if (itemDate - today < milisecondsDay) {li_array.className = isSentYear ? "vencer-mes sent" : "vencer-mes"}
                else {li_array.className = isSentYear ? "vencer-futuro sent" : "vencer-futuro"} 
            }
            li_array.appendChild(span_array)
            childs.push(li_array)
        }
    }
    return childs
}

function addArrowClick () {
    let arrowButtons = document.querySelectorAll('.arrow')

    arrowButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const type = event.target.id.split("-")[0]
            toggleStatusFilter(type)
        })
    })
}

function toggleStatusFilter (type) {
    let filter = document.getElementById(`${type}-filter`)

    filter.style.display === 'none' ?
        filter.style.display = 'flex':
        filter.style.display = 'none'
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


function filterTable (options) {
    const rows = document.querySelectorAll('.cnpj');
    const noItems = document.getElementById("no-items")
    noItems.style.display =  "flex"
    
    rows.forEach(row => {
        const municipio = row.children[2].innerHTML
        const status = row.children[3].children[0].children
        const filterMunicipio = options.includes(municipio)
        let hasStatus = false
        let filters = []
        
        for(item of status) {
            item.style.display = "none" 
            const itemClassName = item.className.split(" ")[0]
            if(options.includes(itemClassName) || options.includes(`${item.className}S` )) {
                item.style.display = "inline-flex" 
                hasStatus = true
            }
        }
        
        filters = [
            filterMunicipio,
            hasStatus
        ]
        const isVisible = filters.some(item => item === false)
        if(!isVisible) {
            row.style.display = "flex"
            noItems.style.display = "none"
        } else {
            row.style.display = "none"
        }
    })
}

function updateCounters() {
    updateCNPJCounter()
    updateStatusCounter()
}

function updateCNPJCounter() {
    const visibleRows = document.querySelectorAll('.cnpj[style*="display: flex;"]')
    const total = document.querySelector('.col1')
    total.dataset.totalcnpj = visibleRows.length
}

function updateStatusCounter() {
    const visibleStatus = document.querySelectorAll('.cnpj[style*="display: flex;"] > li > .status > li[style*="display: inline-flex;"]')
    const total = document.querySelector('.col4')
    total.dataset.totalstatus = visibleStatus.length
}

function markUnmarkAll() {
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

async function markUnmarkYear() {
    const elements = document.querySelectorAll(".vencido, .vencer-mes, .vencer-futuro")

    elements.forEach(element => {
        element.addEventListener('click', async (event) => {
            const element = getParent(event.target, 1)
            const isSent = element.classList.contains("sent")
            const id = getParent(element, 3).dataset?.id
            const year = event.target.innerHTML.replaceAll("\n", "").replaceAll(" ", "")
            const body = {id: id, year: year}
            
            if(!(id && body)) return
            const config = {
                method: isSent ? "DELETE" : "POST",
                headers: {"Content-Type" : "Application/json"},
                body: JSON.stringify(body)
            }
            const resp = await fetch("/consulta-tpi", config)
            if(!resp.ok) return 
            if(isSent) element.classList.remove("sent")
            else element.classList.add("sent")
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

function hideFiltersMouseOut() {
    const filters = document.querySelectorAll('div[id *= -filter]')
    filters.forEach(filter => {
        filter.addEventListener('mouseleave', () => {
            filter.style.display = "none"
        })
    })
}



