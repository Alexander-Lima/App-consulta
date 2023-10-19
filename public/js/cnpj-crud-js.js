document.body.onload = function () {
    deleteItem()
    handleDelete()
    insertItem()
    updateItem()
    selectItems()
    handleSubmit()
    closeForm()
    closeMesssage()
    toggleStatus()
    selectAllButtonHandle()
    unselectAllButtonHandle()
}

function deleteItem () {
    const button = document.getElementById("button-delete")

    button.addEventListener('click', async () => {
        const itemsList = document.querySelectorAll(".selected")
        if(itemsList.length > 0) {
            const confirmOverlay = document.querySelector(".overlay-confirm")
            const hintMessage = document.querySelector("#hint-message")
            hintMessage.innerHTML = `Você realmente deseja excluir ${itemsList.length === 1 ?
                                    "o item selecionado?".toUpperCase() :
                                    `os ${itemsList.length} itens selecionados?`}`.toUpperCase()
            toggleClass(confirmOverlay, "hide", "show")
        } else { toggleWarning("error", "Selecione um item!", false) }
    })
}

function handleDelete() {
    const buttonYes = document.querySelector("#button-yes")
    const buttonNo = document.querySelector("#button-no")

    buttonYes.addEventListener("click", async () => {
        const confirmOverlay = document.querySelector(".overlay-confirm")
        const itemsList = document.querySelectorAll(".selected")
        try {
            let idList = []
            itemsList.forEach(item => idList.push(item.getAttribute("data-id")))
            const resp = await send("/cnpjs-crud", "DELETE", idList)
            toggleClass(confirmOverlay, "show", "hide")
            if(resp.ok) toggleWarning("success", "", true) 
            else toggleWarning("error", await resp.text(), false) 
        } catch (e) {
            toggleClass(confirmOverlay, "show", "hide")
            toggleWarning("error", e.message, false)
        } finally {
            unselectAll()}
    })

    buttonNo.addEventListener("click", () => {
        const confirmOverlay = document.querySelector(".overlay-confirm")
        toggleClass(confirmOverlay, "show", "hide")
        unselectAll()
    })
}

function insertItem () {
    const button = document.getElementById("button-new")
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
            const cnpjText = document.getElementById('cnpj')
            const nameText = document.getElementById('name')
            const ccpText = document.getElementById('ccp-number')
            const municipioText = document.getElementById('municipio')
            const commentText = document.getElementById('comments')
            const invalidCCP = ["-", "", "----------"]

            const idRow = selectedItems[0].getAttribute("data-id")
            const cnpjRow = selectedItems[0].childNodes[5]
            const nameRow = selectedItems[0].childNodes[11]
            const municipioRow = selectedItems[0].childNodes[9]
            const ccpRow = selectedItems[0].childNodes[7]
            const commentRow = selectedItems[0]
                                    ?.childNodes[11]
                                    ?.childNodes[1]
                                    ?.getAttribute("data-comment")
            cnpjText.value = formatCNPJ(cnpjRow.innerText)
            nameText.value = nameRow.innerText
            municipioText.value = municipioRow.innerText
            ccpText.value = invalidCCP.includes(ccpRow.innerText) ? "" : ccpRow.innerText
            commentText.value = commentRow ? commentRow : ""
            cnpjText.setAttribute("data-id", idRow)
  
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
            const element = event.target.parentElement
            if(element.localName !== "tr") return

            if(element.classList.contains("selected")) { element.classList.remove("selected"); return }
            element.classList.add("selected")
        })
    })
}

function selectAllButtonHandle() {
    const button = document.getElementById('button-select-all');

    button.addEventListener('click', () => {
        const elements = document.querySelectorAll("tr")
        elements.forEach(element => element.classList.add("selected"));
    })
}

function unselectAllButtonHandle() {
    const button = document.getElementById('button-unselect-all');

    button.addEventListener('click', () => unselectAll())
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
        
        const cnpj = document.getElementById('cnpj')
        const cnpjText = cnpj.value
        const cnpjId = cnpj.getAttribute("data-id")
        const nameText = document.getElementById('name').value
        const ccpNumber = document.getElementById("ccp-number").value
        const municipioText = document.getElementById('municipio').value
        const commentsText = document.getElementById('comments').value
        const req_body = {
            cnpj: cnpjText,
            cnpjId: cnpjId ,
            name: nameText,
            ccp: ccpNumber,
            municipio: municipioText,
            comments: commentsText
        }
        try {
            const resp = await send("/cnpjs-crud", cnpjId ? "PUT" : "POST", req_body)
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
    if(type === "error") warnings.error.innerHTML = `<p>ERRO: ${message}</p>`
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
            let resp = await send("/cnpjs-crud/toggle-status/", "PUT", items)
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
    const selectedItems = document.querySelectorAll(".selected")
    selectedItems.forEach(item => item.classList.remove("selected"))
}

function getWarnings() {
    return {
        success: document.getElementById("success"),
        error: document.getElementById("error")
    }
}