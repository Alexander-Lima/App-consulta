const axios = require('axios').default

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
            
            for (item of itemsList) {
                const {
                    STATUS,
                    CNPJ,
                    CCP_NUMBER,
                    NOME_EMPRESA,
                    MUNICIPIO,
                    COMMENT_ID,
                    COMMENT_TEXT,
                    YEARS
                } = item
                if(STATUS === 0 || (CNPJ !== "46884635000108" && CNPJ !== "24869131000178")) continue 
                const url = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
                const configs = { headers: { "Content-Type" : "application/json" } }
                let itemResult = {
                    cnpj: CNPJ,
                    nome_empresa: NOME_EMPRESA,
                    no_ccp_number: !CCP_NUMBER,
                    failure: true,
                    municipio: MUNICIPIO,
                    comment_id: COMMENT_ID,
                    comment_text: COMMENT_TEXT,
                    years_sent: YEARS ? YEARS.split(";") : null,
                    debits: false
                }
                if(!CCP_NUMBER) {
                    itemResult.failure = false
                    results.push(itemResult);
                    continue
                }
                const data = { "ccp" : Number(CCP_NUMBER) }
                const resp = await axios.post(url, data, configs)
                                        .catch(() => false)   
                if(resp.data) {
                    itemResult.debits = resp.data?.listaRetorno
                    itemResult.failure = false
                }
                results.push(itemResult)
            }  
            return results
        }
    }
    return this
}
