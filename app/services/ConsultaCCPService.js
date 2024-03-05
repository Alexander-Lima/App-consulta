const axios = require('axios').default

module.exports = function () {
    this.getCCP = async (DAO) => {
        const results = await DAO.getAllJoinCCP()
        if(!results) { 
            throw new Error("Falha no Banco de Dados!")
        }
        const data = await getData(results.filter(emp => emp.id <= 5))
        if(!data) { 
            throw new Error("Falha na busca de CCP!")
        }
        return data
    }
        
    async function getData (itemsList) {
        let results = []
        
        for (item of itemsList) {
            const {
                id,
                status,
                cnpj,
                ccp_number,
                nome_empresa,
                municipio,
                comment_id,
                comment_text,
                duam,
                licenses_sent
            } = item

            if(status === 0) {
                continue 
            }
            const url = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
            const configs = { headers: { "Content-Type" : "application/json" } }
            let itemResult = {
                id: id,
                cnpj: cnpj,
                nome_empresa: nome_empresa,
                no_ccp_number: !ccp_number,
                failure: true,
                municipio: municipio,
                comment_id: comment_id,
                comment_text: comment_text,
                duam_sent: duam ? duam.split("|") : [],
                debits: [],
                license_sent: licenses_sent
            }
            if(!ccp_number) {
                itemResult.failure = false
                results.push(itemResult);
                continue
            }
            const data = { "ccp" : Number(ccp_number) }
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
    return this
}
