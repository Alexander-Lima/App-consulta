const axios = require('axios').default
const formData = require('form-data')
const util = require('../utilities/util').util

module.exports = function () {
    this.updateItem = function (queryCnpj, yearsSent) {
        return new Promise(async (res, rej) => {
            const sanitizedCNPJ = util.sanitizeCNPJ(queryCnpj)
            if(!sanitizedCNPJ) { rej(); return }
            const items = await getCNPJ(sanitizedCNPJ)
            const data = await getData(items, yearsSent)
            res(data)
        })

        async function getCNPJ (cnpj) {
            const form = new formData()
    
            form.append("acao", "buscar_logradouros")
            form.append("cnpj", `${cnpj}`)
            let resp= await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                                    .catch(err => false)
            if(!resp) {
                resp = {SEM_REGISTRO: true}
                resp.CPF_CNPJ = cnpj
            }
            return resp;   
        }
    
        async function getData (item, yearsSent) {
            if(item.SEM_REGISTRO) return item
            const form = new formData()
            const data = item.data[0]
            form.append("acao", "buscar_tpi")
            form.append("data[CPF_CNPJ]", `${data.CPF_CNPJ}`)
            form.append("data[C_ID]", `${data.C_ID}`)
            form.append("data[ANO_ATUAL]", `${data.ANO_ATUAL}`)
            form.append("data[ANO_INICIO_TPI]", `${data.ANO_INICIO_TPI}`)
            form.append("data[SP_ID]", `${data.SP_ID}`)
            
            const resp = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                                       .catch(err => false)
            if(!resp) {
                resp = {FALHOU: true}
                resp.CPF_CNPJ = data.CPF_CNPJ
                return resp
            }
            if(yearsSent.SENT) resp.data.push(yearsSent)
            if(resp) return resp.data
        }
    }
    return this
}
