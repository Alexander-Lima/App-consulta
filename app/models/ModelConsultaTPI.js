const axios = require('axios').default
const formData = require('form-data')
const error_SEM_REGISTRO = false
const error_FALHA = false

module.exports = function () {
    this.getTPI = (results) => {
        return new Promise (async (res, rej) => {
            const items = await getCnpjData(results)

            if(!items) { rej("Falha ao buscar empresas no Sicabom"); return }
            
            const data = await getTpiData(items)

            if(!data) { rej("Falha ao buscar dados no Sicabom"); return }

            res(data)
        })

        async function getCnpjData (rows) {
            let results = []
        
            for (row of rows) {
                if(row.STATUS === 0) continue
                let form_data = new formData()
        
                form_data.append("acao", "buscar_logradouros")
                form_data.append("cnpj", `${row.CNPJ}`)
                
                let resp_row = false

                if(!error_SEM_REGISTRO) {
                    resp_row = await axios.post(
                        "https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                        .catch(err => false)
                }

                if(!resp_row) {
                    resp_row = { data: [{SEM_REGISTRO: true}]} 
                    resp_row.data[0].CPF_CNPJ = row.CNPJ
                }
                const data = resp_row.data[0]
                data.SENT = row.SENT ? row.SENT.split(";") : false
                data.NOME_EMPRESA = row.NOME_EMPRESA
                data.ID = row.ID
                data.MUNICIPIO = row.MUNICIPIO
                data.COMMENT_ID = row.COMMENT_ID
                data.COMMENT_TEXT = row.COMMENT_TEXT
                
                results.push(data)
            }
            return results;   
        }
        
        async function getTpiData (items) {
            let results = []
            for (item of items) {
                if(item.SEM_REGISTRO) {
                    let obj = {}
                    let objArray = []
                    
                    obj.SEM_REGISTRO = item.SEM_REGISTRO
                    obj.CPF_CNPJ = item.CPF_CNPJ
        
                    objArray.push(obj)
                    objArray.push({ NOME_EMPRESA : item.NOME_EMPRESA })
                    objArray.push({ ID : item.ID })
                    objArray.push({ MUNICIPIO : item.MUNICIPIO })
                    objArray.push({ COMMENT_ID : item.COMMENT_ID })
                    objArray.push({ COMMENT_TEXT : item.COMMENT_TEXT })
                    
                    results.push(objArray)
                    continue
                }
                
                let form_data = new formData()
        
                form_data.append("acao", "buscar_tpi")
                form_data.append("data[CPF_CNPJ]", `${item.CPF_CNPJ}`)
                form_data.append("data[C_ID]", `${item.C_ID}`)
                form_data.append("data[ANO_ATUAL]", `${item.ANO_ATUAL}`)
                form_data.append("data[ANO_INICIO_TPI]", `${item.ANO_INICIO_TPI}`)
                form_data.append("data[SP_ID]", `${item.SP_ID}`)
                
                let resp_item = false

                if(!error_FALHA) {
                    resp_item = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form_data)
                    .catch(err => false)
                }
                if(!resp_item) {
                    resp_item = {data: [{FALHOU: true}]}
                    resp_item.data[0].CPF_CNPJ = item.CPF_CNPJ
                }
                if(item.SENT) resp_item.data.push({ SENT : item.SENT })
                
                resp_item.data.push({ NOME_EMPRESA : item.NOME_EMPRESA })
                resp_item.data.push({ ID : item.ID })
                resp_item.data.push({ MUNICIPIO : item.MUNICIPIO })
                resp_item.data.push({ COMMENT_ID : item.COMMENT_ID })
                resp_item.data.push({ COMMENT_TEXT : item.COMMENT_TEXT })
                results.push(resp_item.data)
            }
            return results;
        }
    }
    return this
}
