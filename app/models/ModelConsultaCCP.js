const axios = require('axios').default
const error_CCPNUMBER = false
const erro_FALHA = false

module.exports = function () {
    this.getCCP = (DAO) => {
        return new Promise (async (res, rej) => {
            const results = await DAO.getAllJoinCCP().catch(err => false)

            if(!results) { rej("Falha no Banco de Dados!"); return }
    
            const data = await getData(results)

            if(!data) { rej("Falha na busca de CCP!"); return }

            res(data)
        })
        
        async function getData (itemsList) {
            let results = []
            const url = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
            const config = {
                headers: { "Content-Type" : "application/json" }
            }
            
            for (item of itemsList) {
                if(error_CCPNUMBER) { item.CCP_NUMBER = "" }
                if(!item.CCP_NUMBER) {
                    let falha = {
                        cnpj : item.CNPJ,
                        nome_empresa : item.NOME_EMPRESA,
                        no_ccp_number : true,
                        municipio : item.MUNICIPIO
                    }
                    results.push(falha)
                } else {
                    let resp = false
                    if(!erro_FALHA) {
                        let data = { "ccp" : Number(item.CCP_NUMBER) }
                        resp = await axios.post(url, data, config)
                            .catch(err => false)
                    }
                    if(resp.data) {
                        resp.data.cnpj = item.CNPJ
                        resp.data.nome_empresa = item.NOME_EMPRESA
                        resp.data.municipio = item.MUNICIPIO
                        results.push(resp.data)
            
                    } else {
                        let falha = {
                            cnpj : item.CNPJ,
                            nome_empresa : item.NOME_EMPRESA,
                            failure : true,
                            municipio : item.MUNICIPIO
                        }
                        results.push(falha)
                    }
                }
            }
            return results
        }
    }
    return this
}
