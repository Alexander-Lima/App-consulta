const https = require('https')
const util = require('../utilities/util').util
const axios = require('axios')
// const Cache = require('../utilities/cache')

module.exports = function () {
    const axiosInstance = axios.create({ 
        httpsAgent: new https.Agent({ rejectUnauthorized: false }) 
    })

    const baseConfigs = { 
        headers: { 
            "Content-Type" : "application/json", 
            "Cookie": null,
            "X-Auth-Token": null
        }
    }

    this.getCCP = async (DAO) => {
        // const cache = new Cache();
        // const cachedData = await cache.get("ccp");
        // if(cachedData) {
        //     return cachedData;
        // }

        const results = await DAO.getAllJoinCCP()

        if(!results) { 
            throw new Error("Falha no Banco de Dados!")
        }

        await getJWT();

        if(!baseConfigs.headers["X-Auth-Token"]) {
            throw new Error("Falha ao gerar JWT!")
        }
        
        const data = await getData(results)
        
        if(!data) { 
            throw new Error("Falha na busca de CCP!")
        }
        
        const responseObject = {
            data: data,
            filters: createFilters(data)
        }

        // await cache.put("ccp", responseObject);
        return responseObject;
    }
        
    async function getData (itemsList) {
        let results = []
        const maxPromises = 10

        while(itemsList.length > 0) {
            const promisesResult = await util.getPromisesArray(itemsList, getDataForCnpj, maxPromises)
            results.push(...promisesResult)
        }  

        return results.filter(item => item)
    }

    async function getDataForCnpj(item) {
        return new Promise(async (res) => {
            if(item.status === 0) {
                return res(null) 
            }
         
            item['cityCode'] = null
            item['no_ccp_number'] = !item.ccp_number
            item['failure'] = true
            item['duam_sent'] = item.duams ? item.duams : []
            item['debits'] = []
            item['cityCodes'] = [];
            
            if(item.no_ccp_number) {
                item.failure = false
                return res(item)
            }
            
            const urlCCP = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos"
            
            const respCCP = await axiosInstance.post(urlCCP, { "ccp" : Number(item.ccp_number) }, baseConfigs)
                                .catch((error) => false)
            if(respCCP.data) {
                item.debits = respCCP.data?.listaRetorno
                item.failure = false
            }
            
            const urlContributor = 
                "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarContribuintes"
        
            const respContributor = await axiosInstance.post(urlContributor, { "cnpj": item.cnpj }, baseConfigs)
                                .catch((error) => false)
        
            item.cityCodes = 
                Array.isArray(respContributor.data) ? 
                    respContributor.data.filter(item => item.inscricao).map(item => item.inscricao) : []
            
            res(item)
        })

    }

    async function getJWT() {
        const data = {
            "modulo":"servicosonline",
            "token": "d5e5f85abdcfc21cddfc97e1fc6372db0445629f86b1a22a772a58d753bb40f8"
        }

        const url = "https://sig.catalao.go.gov.br/sig/rest/loginController/validarLoginParaModuloPublico"

        const resp = await axiosInstance.post(url, data, baseConfigs)
                                .catch((error) => error)

        baseConfigs.headers.Cookie = 
            resp?.headers['set-cookie'] ? resp.headers['set-cookie'].toString() : ""

        baseConfigs.headers['X-Auth-Token'] = resp?.data?.token;
    }

    function createFilters(data) {
        const filters = {
            status: new Set(),
            city: new Set()
        }

        data.forEach(item => {
            filters.city.add(item.municipio);

            if(item.no_ccp_number) {
                filters.status.add("SEM CCP")

            } else if(item.failure) {
                filters.status.add("FALHA")

            } else if(item.debits.length) {
                filters.status.add("PENDENTES")
                
            } else if(!item.debits.length) {
                filters.status.add(item.license_sent ? "ENVIADO" : "SEM PENDÊNCIAS")
            }
        })

        Object.entries(filters).forEach(([key, value]) => filters[key] = Array.from(value))

        return filters;
    }

    return this
}
