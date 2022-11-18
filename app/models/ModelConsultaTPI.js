const axios = require('axios').default
const formData = require('form-data')
const error_SEMREGISTRO = false
const error_FALHA = false

module.exports = function () {
    this.getTPI = (results) => {
        return new Promise (async (res, rej) => {
            const items = await getCNPJ(results)

            if(!items) {rej("Falha ao buscar empresas no Sicabom"); return}
            
            let data = await getData(items)

            if(!data) {rej("Falha ao buscar dados no Sicabom"); return}

            res(data)
        })

        async function getCNPJ (rows) {
            let results = []
        
            for (row of rows) {
                let form_data = new formData()
        
                form_data.append("acao", "buscar_logradouros")
                form_data.append("cnpj", `${row.cnpj}`)
                
                let resp_row = false

                if(!error_SEMREGISTRO) {
                    resp_row = await axios.post(
                        "https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                        .catch(err => false)
                }

                if(!resp_row) {
                    resp_row = {data: [{SEM_REGISTRO: true}]}
                    resp_row.data[0].CPF_CNPJ = row.cnpj
                }
                resp_row.data[0].SENT = row.sent ? row.sent.split(";") : false
                resp_row.data[0].NOME_EMPRESA = row.nome_empresa
                resp_row.data[0].ID = row.id
                resp_row.data[0].MUNICIPIO = row.municipio
                
                results.push(resp_row.data[0])
            }
            return results;   
        }
        
        async function getData (items) {
            let results = []
            
            for (item of items) {
                if(item.SEM_REGISTRO) {
                    let obj = {}
                    let objArray = []
                    
                    obj.SEM_REGISTRO = item.SEM_REGISTRO
                    obj.CPF_CNPJ = item.CPF_CNPJ
        
                    objArray.push(obj)
                    objArray.push({NOME_EMPRESA : item.NOME_EMPRESA})
                    objArray.push({ID : item.ID})
                    objArray.push({MUNICIPIO : item.MUNICIPIO})
                    
                    results.push(objArray)
                    continue
                }
                
                let form_data = new formData()
        
                form_data.append("acao", "buscar_tpi")
                form_data.append("data[CPF_CNPJ]", `${item.CPF_CNPJ}`)
                form_data.append("data[C_ID]", `${item.C_ID}`)
                form_data.append("data[ANO_ATUAL]", `${item.ANO_ATUAL}`)
                form_data.append("data[ANO_INICIO_TPI]", `${item.ANO_INICIO_TPI}`)
                
                let resp_item = false

                if(!error_FALHA) {
                    resp_item = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                    .catch(err => false)
                }
                if(!resp_item) {
                    resp_item = {data: [{FALHOU: true}]}
                    resp_item.data[0].CPF_CNPJ = item.CPF_CNPJ
                }
                if(item.SENT) resp_item.data.push({SENT : item.SENT})
                
                resp_item.data.push({NOME_EMPRESA : item.NOME_EMPRESA})
                resp_item.data.push({ID : item.ID})
                resp_item.data.push({MUNICIPIO : item.MUNICIPIO})
                results.push(resp_item.data)
            }
            return results;
        }
    }
    return this
}
