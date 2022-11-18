document.body.onload = function () {
    deleteItem()
    insertItem()
    updateItem()
    selectItems()
    handleSubmit()
    closeForm()
}

function deleteItem () {
    let button = document.getElementById("button-delete")

    button.addEventListener('click', async () => {
        let itemsList = document.querySelectorAll(".selected")
        
        if(itemsList.length > 0) {
            let req_body = {ids: ""}
            let idList = []
            let userResp = confirm(`Você realmente deseja excluir ${itemsList.length === 1 ?
                                                        "o item selecionado?".toUpperCase() :
                                                        `os ${itemsList.length} itens selecionados?`}`.toUpperCase())

            if(!userResp) return

            itemsList.forEach(item => {idList.push(item.getAttribute("data-id"))})
            req_body.ids = idList.join(",")

            try {
                let resp = await send("/cnpjs-crud", "DELETE", req_body)
                resp.ok? toggleWarning("success", "", true) : toggleWarning("error", await resp.text(), true)
            } catch {
                toggleWarning("error", "Falha de conexão!")
            }
        } else {
            toggleWarning("error", "Selecione um item!")
        }
    })
}

function insertItem () {
    let button = document.getElementById("button-new")
    
    button.addEventListener('click', async () => {
        let selectedItems = document.querySelectorAll(".selected")
        
        selectedItems.forEach(item => item.classList.remove("selected"))
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

            let cnpj_row = selectedItems[0].childNodes[3]
            let ccp_row = selectedItems[0].childNodes[5]
            let municipio_row = selectedItems[0].childNodes[7]
            let name_row = selectedItems[0].childNodes[9]
            let id_row = selectedItems[0].getAttribute("data-id")
            
            cnpj_text.value = formatCNPJ(cnpj_row.innerText)
            name_text.value = name_row.innerText

            ccp_text.value = invalidCCP.includes(ccp_row.innerText) ? "" : ccp_row.innerText
            console.log(ccp_text.value)
            municipio_text.value = municipio_row.innerText
            cnpj_text.setAttribute("data-id", id_row)
  
        } else if(selectedItems.length > 1) {
            toggleWarning("error", "Só é possível alterar um item por vez!")
        } else {
            toggleWarning("error", "Selecione um item!")
        }

    })
}

function selectItems () {
    let items = document.querySelectorAll('tr');

    items.forEach(item => {
        item.addEventListener('click', (event) => {
            let element = event.target.parentElement

            if(element.classList.contains("selected")) {element.classList.remove("selected"); return}
            element.classList.add("selected")
        })
    })
}

function send (url, req_method, req_body) {
    return fetch(url, {
        headers: {"Content-Type" : "Application/json"},
        method: req_method,
        body: JSON.stringify(req_body)
    })
}

function toggleOverlay () {
    let overlay = document.getElementsByClassName('overlay').item(0)

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
        let req_body = {
            cnpj: cnpj.value,
            name: name_text,
            id: cnpj_id ? cnpj_id : "",
            ccp: ccp_number ? ccp_number : "",
            municipio: municipio_text
        }

        try {
            let resp = await send("/cnpjs-crud", cnpj_id ? "PATCH" : "POST", req_body)
            resp.ok? toggleWarning("success", "", true) 
                    : toggleWarning("error", await resp.text(), true)  
        } catch {
            toggleWarning("error", "Falha de conexão!")
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
    const warnings = {
        success: document.getElementById("success"),
        error: document.getElementById("error")
    }

    if(type === "error") warnings[type].innerHTML = message
    warnings[type].className = "show"
    setTimeout(() => {
        warnings[type].className = "hide"
        if(reload) location.reload()
    }, 3000)
}

function closeForm () {
    let closeButton = document.getElementsByClassName("close-form")[0]
    
    closeButton.addEventListener("click", () => {
        let form = document.getElementById("form")
        let overlay = document.getElementsByClassName('overlay').item(0)

        form.reset()
        cnpj.setAttribute("data-id", "")
        overlay.style.display = "none"

    })
}