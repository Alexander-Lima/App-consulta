const axios = require('axios').default

module.exports = function () {
    this.getCCP = async (DAO) => {
        const results = await DAO.getAllJoinCCP()
        if(!results) { 
            throw new Error("Falha no Banco de Dados!")
        }
        const data = await getData(results)
        if(!data) { 
            throw new Error("Falha na busca de CCP!")
        }
        return data
    }
        
    async function getData (itemsList) {
        let results = []
        const maxPromises = 10

        while(itemsList.length > 0) {
            const promisesArray = getPromisesArray(itemsList, maxPromises)
            const promises = Promise.all(promisesArray)
            const cnpjData = await promises
            results.push(...cnpjData)
        }  
        return results.filter(item => item)
    }

    function getPromisesArray(itemsArray, itemsToProcess) {
        let resultArray = []

        for(let index = 0; index < itemsToProcess; index++) {
            if(itemsArray.length > 0) {
                const arrayItem = itemsArray.pop()
                resultArray.push(getDataForCnpj(arrayItem))
                continue
            }
            break
        }
        return resultArray
    }

    async function getDataForCnpj(item) {
        return new Promise(async (res) => {
            const {
                id,
                cnpj,
                status,
                ccp_number,
                nome_empresa,
                municipio,
                comment_id,
                comment_text,
                duam,
                licenses_sent
            } = item

            console.log("processando", cnpj)
            if(status === 0) {
                return res(null) 
            }

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
                return res(itemResult)
            }
    
            const url = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
            const configs = { headers: { "Content-Type" : "application/json" } }
            const data = { "ccp" : Number(ccp_number) }
            const resp = await axios.post(url, data, configs)
                                    .catch(() => false)   
            if(resp.data) {
                itemResult.debits = resp.data?.listaRetorno
                itemResult.failure = false
            }
            res(itemResult)
        })
    }
    return this
}
