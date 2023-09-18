document.body.onload = function () {
    deleteItems()
    insertItem()
    updateItem()
    selectItems()
    handleSubmit()
    closeForm()
    closeMesssage()
    toggleStatus()
}

function deleteItems () {
    let button = document.getElementById("button-delete")

    button.addEventListener('click', async () => {
        const itemsList = document.querySelectorAll(".selected")
        
        if(itemsList.length > 0) {
            let idList = []
            let userResp = confirm(`Você realmente deseja excluir ${itemsList.length === 1 ?
                                                        "o item selecionado?".toUpperCase() :
                                                        `os ${itemsList.length} itens selecionados?`}`.toUpperCase())

            if(!userResp) return
            itemsList.forEach(item => { idList.push(item.getAttribute("data-id")) })
            try {
                const resp = await send("/cnpjs-crud", "DELETE", { idArray: idList })
                resp.ok? toggleWarning("success", "", true) : toggleWarning("error", await resp.text(), false)
            } catch {
                toggleWarning("error", "Falha de conexão!", false)
            }
        } else {
            toggleWarning("error", "Selecione um item!", false)
        }
    })
}

function insertItem () {
    let button = document.getElementById("button-new")
    
    button.addEventListener('click', async () => {
        unselectAll()
        toggleOverlay()
    })
}

function updateItem () {
    let button = document.getElementById("button-update")
    button.addEventListener('click', async () => {
       const selectedItems = document.querySelectorAll('.selected')

       if(selectedItems.length === 1) {
            toggleOverlay()
            let cnpj_text = document.getElementById('cnpj')
            let name_text = document.getElementById('name')
            let ccp_text = document.getElementById('ccp-number')
            let municipio_text = document.getElementById('municipio')
            const invalidCCP = ["-", "", "----------"]

            let id_row = selectedItems[0].getAttribute("data-id")
            let cnpj_row = selectedItems[0].childNodes[5]
            let name_row = selectedItems[0].childNodes[11]
            let municipio_row = selectedItems[0].childNodes[9]
            let ccp_row = selectedItems[0].childNodes[7]
            
            cnpj_text.value = formatCNPJ(cnpj_row.innerText)
            name_text.value = name_row.innerText
            municipio_text.value = municipio_row.innerText
            ccp_text.value = invalidCCP.includes(ccp_row.innerText) ? "" : ccp_row.innerText
            cnpj_text.setAttribute("data-id", id_row)
  
        } else if(selectedItems.length > 1) {
            toggleWarning("error", "Só é possível alterar um item por vez!", false)
        } else {
            toggleWarning("error", "Selecione um item!", false)
        }

    })
}

function selectItems() {
    let items = document.querySelectorAll('tr');

    items.forEach(item => {
        item.addEventListener('click', (event) => {
            let element = event.target.parentElement

            if(element.classList.contains("selected")) { element.classList.remove("selected"); return }
            element.classList.add("selected")
        })
    })
}

function send(url, req_method, req_body) {
    return fetch(url, {
        headers: { "Content-Type" : "Application/json" },
        method: req_method,
        body: req_body ? JSON.stringify(req_body) : null
    })
}

function toggleOverlay () {
    let overlay = document.getElementsByClassName('overlay-form').item(0)

    overlay.style.display === "none" ? 
        overlay.style.display = "flex" : 
        overlay.style.display = "none"  
}

function handleSubmit () {
    let form = document.getElementById("form")
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        
        let cnpj = document.getElementById('cnpj')
        let cnpj_id = cnpj.getAttribute("data-id")
        let ccp_number = document.getElementById("ccp-number").value
        let name_text = document.getElementById('name').value
        let municipio_text = document.getElementById('municipio').value
        let comments_text = document.getElementById('comments').value
        let req_body = {
            cnpj: cnpj.value,
            name: name_text,
            id: cnpj_id ? cnpj_id : "",
            ccp: ccp_number ? ccp_number : "",
            municipio: municipio_text,
            comments: comments_text ? comments_text : ""
        }

        try {
            let resp = await send("/cnpjs-crud", cnpj_id ? "PATCH" : "POST", req_body)
            resp.ok? toggleWarning("success", "", true) 
                    : toggleWarning("error", await resp.text(), false)  
        } catch {
            toggleWarning("error", "Falha de conexão!", false)
        } finally {
            toggleOverlay()
            form.reset()
        }
    })
}

function formatCNPJ (cnpj) {
    return cnpj.replace("/", "").replaceAll(".", "").replace("-", "")
}

function toggleWarning (type, message, reload) {
    const warnings = getWarnings()
    const overlay = document.querySelector(".overlay-message")
    toggleClass(overlay, "hide", "show")
    if(type === "error") warnings.error.innerHTML = `<p>${message}</p>`
    warnings[type].className = "show"

    if(type === "success") {
        setTimeout(() => {
            toggleClass(overlay, "show", "hide")
            warnings[type].className = "hide"
            if(reload) location.reload()
        }, 1000)
    }
}

function closeForm () {
    let closeButton = document.getElementsByClassName("close-form")[0]
    
    closeButton.addEventListener("click", () => {
        let form = document.getElementById("form")
        let overlay = document.getElementsByClassName('overlay-form').item(0)

        form.reset()
        cnpj.setAttribute("data-id", "")
        overlay.style.display = "none"
    })
}

function closeMesssage () {
    let closeButton = document.getElementsByClassName("close-message")[0]
    
    closeButton.addEventListener("click", () => {
        const overlay = document.querySelector(".overlay-message")
        const warnings = getWarnings()
        toggleClass(overlay, "show", "hide")
        toggleClass(warnings.error,"show", "hide")
        toggleClass(warnings.success,"show", "hide")
    })
}

function toggleStatus () {
    let button = document.getElementById("button-toggle-status")

    button.addEventListener('click', async () => {
        const selectedItems = document.querySelectorAll(".selected")
        const items = []
        
        if(selectedItems.length === 0) { toggleWarning("error", "Selecione um item!", false); return }

        selectedItems.forEach(item => {
            const statusElement = item.children[1]
            const newStatus = statusElement.innerHTML === "ATIVO" ? 0 : 1

            items.push({
                id : item.getAttribute("data-id"),
                newStatus : newStatus
            })
        })

        try {
            let resp = await send("/cnpjs-crud/toggle-status/", "PATCH", items)
            if(resp.ok) {
                toggleWarning("success", "", false)
                selectedItems.forEach(item => {
                    const statusElement = item.children[1]
                    statusElement.innerHTML = statusElement.innerHTML === "ATIVO" ? "INATIVO" : "ATIVO"
                })
                unselectAll()
            } else {
                toggleWarning("error", await resp.text(), false)
            }
        } catch {
            toggleWarning("error", "Falha de conexão!", false)
        }
    })
}

function toggleClass(element, removedClass, addedClass) {
    element.classList.remove(removedClass)
    element.classList.add(addedClass)
}

function unselectAll() {
    let selectedItems = document.querySelectorAll(".selected")
    selectedItems.forEach(item => item.classList.remove("selected"))
}

function getWarnings() {
    return {
        success: document.getElementById("success"),
        error: document.getElementById("error")
    }
}