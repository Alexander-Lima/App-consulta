const axios = require('axios').default
const formData = require('form-data')
const util = require('../utilities/util').util

module.exports = function () {
    this.updateItem = function (queryCnpj,yearsSent) {
        return new Promise(async (res, rej) => {
            let sanitizedCNPJ = util.sanitizeCNPJ(queryCnpj)
    
            if(!sanitizedCNPJ) {rej(); return}
    
            let items = await getCNPJ(sanitizedCNPJ)
            let data = await getData(items, yearsSent)
            
            res(data)
        })

        async function getCNPJ (cnpj) {
            let form_data = new formData()
    
            form_data.append("acao", "buscar_logradouros")
            form_data.append("cnpj", `${cnpj}`)
            
            let resp_row = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                                    .catch(err => false)
    
                if(!resp_row) {
                    resp_row = {SEM_REGISTRO: true}
                    resp_row.CPF_CNPJ = cnpj
                }
                
            return resp_row;   
        }
    
        async function getData (item, yearsSent) {
            if(item.SEM_REGISTRO) return item
            
            let form_data = new formData()
            let data = item.data[0]
    
            form_data.append("acao", "buscar_tpi")
            form_data.append("data[CPF_CNPJ]", `${data.CPF_CNPJ}`)
            form_data.append("data[C_ID]", `${data.C_ID}`)
            form_data.append("data[ANO_ATUAL]", `${data.ANO_ATUAL}`)
            form_data.append("data[ANO_INICIO_TPI]", `${data.ANO_INICIO_TPI}`)
            
            let resp_item = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                                    .catch(err => false)
    
            // let resp_item = false
            
            if(yearsSent.SENT) resp_item.data.push(yearsSent)
            if(resp_item) return resp_item.data
    
            resp_item = {FALHOU: true}
            resp_item.CPF_CNPJ = data.CPF_CNPJ

            return resp_item
        }
    }
    return this
}
