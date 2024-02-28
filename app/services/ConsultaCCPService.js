const axios = require('axios').default

module.exports = function () {
    this.getCCP = (DAO) => {
        return new Promise (async (res, rej) => {
            const results = await DAO.getAllJoinCCP().catch(err => false)
            if(!results) { 
                return rej("Falha no Banco de Dados!")
            }
            const data = await getData(results)
            if(!data) { 
                return rej("Falha na busca de CCP!")
            }
            res(data)
        })
        
        async function getData (itemsList) {
            let results = []
            
            for (item of itemsList) {
                const {
                    ID,
                    STATUS,
                    CNPJ,
                    CCP_NUMBER,
                    NOME_EMPRESA,
                    MUNICIPIO,
                    COMMENT_ID,
                    COMMENT_TEXT,
                    DUAM,
                    LICENSES_SENT
                } = item
                if(STATUS === 0) continue 
                const url = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
                const configs = { headers: { "Content-Type" : "application/json" } }
                let itemResult = {
                    id: ID,
                    cnpj: CNPJ,
                    nome_empresa: NOME_EMPRESA,
                    no_ccp_number: !CCP_NUMBER,
                    failure: true,
                    municipio: MUNICIPIO,
                    comment_id: COMMENT_ID,
                    comment_text: COMMENT_TEXT,
                    duam_sent: DUAM ? DUAM.split(";") : [],
                    debits: [],
                    license_sent: LICENSES_SENT
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
