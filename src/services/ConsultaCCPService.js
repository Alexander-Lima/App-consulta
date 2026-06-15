import https from 'node:https'
import { getAxiosRetryDefaultConfig, getPromisesArray } from '../utilities/util.js'
import axios from 'axios'
import axiosRetry from 'axios-retry'
// import Cache from '../utilities/cache.js'

const axiosInstance = axios.create({ 
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
})

axiosRetry(axiosInstance, getAxiosRetryDefaultConfig());

const baseConfigs = { 
    headers: { 
        "Content-Type" : "application/json", 
        "Cookie": null,
        "X-Auth-Token": null
    }
}

async function getCCP(ccpList) {
    // const cache = new Cache();
    // const cachedData = await cache.get("ccp");
    // if(cachedData) {
    //     return cachedData;
    // }

    if(!ccpList) { 
        throw new Error("Falha no Banco de Dados!");
    }

    await getJWT();

    if(!baseConfigs.headers["X-Auth-Token"]) {
        throw new Error("Falha ao gerar JWT!");
    }
    
    const data = await getData(ccpList);
    
    if(!data) { 
        throw new Error("Falha na busca de CCP!");
    }
    
    const responseObject = {
        data: data,
        filters: createFilters(data)
    }

    // await cache.put("ccp", responseObject);
    return responseObject;
}
    
async function getData(itemsList) {
    let results = [];
    const maxPromises = 10;

    while(itemsList.length > 0) {
        const promisesResult = await getPromisesArray(itemsList, getDataForCnpj, maxPromises);
        results.push(...promisesResult);
    }  

    return results.filter(item => item);
}

async function getDataForCnpj(item) {
    return new Promise(async (res) => {
        if(item.status === 0) {
            return res(null) ;
        }
        
        item['no_ccp_number'] = !item.ccp_number;
        item['failure'] = true;
        item['duam_sent'] = item.duams ? item.duams : [];
        item['debits'] = [];
        item['cityCodes'] = [];
        
        if(item.no_ccp_number) {
            item.failure = false;
            return res(item);
        }
        
        const urlCCP = "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarDebitos";
        
        const respCCP = 
            await axiosInstance
                .post(urlCCP, { "ccp" : Number(item.ccp_number) }, baseConfigs)
                .catch((error) => false);

        if(respCCP.data) {
            item.debits = respCCP.data?.listaRetorno;
            item.failure = false;
        }
        
        const urlContributor = 
            "https://sig.catalao.go.gov.br/sig/rest/servicoContribuinteController/pesquisarContribuintes";
    
        const respContributor = 
            await axiosInstance
                .post(urlContributor, { "cnpj": item.cnpj }, baseConfigs)
                .catch((error) => error);

        item.cityCodes = 
            !respContributor.data ?
                ["<ERRO>"] :
                respContributor.data
                    .filter(item => item.inscricao)
                    .map(item => item.inscricao);
        
        res(item);
    })

}

async function getJWT() {
    const data = {
        "modulo":"servicosonline",
        "token": process.env.JWT_TOKEN_CCP
    };

    const url = "https://sig.catalao.go.gov.br/sig/rest/loginController/validarLoginParaModuloPublico";

    const resp = await axiosInstance.post(url, data, baseConfigs)
                            .catch((error) => error);

    baseConfigs.headers.Cookie = 
        resp?.headers['set-cookie'] ? resp.headers['set-cookie'].toString() : "";

    baseConfigs.headers['X-Auth-Token'] = resp?.data?.token;
}

function createFilters(data) {
    const filters = {
        status: new Set(),
        city: new Set()
    };

    data.forEach(item => {
        filters.city.add(item.municipio);

        if(item.no_ccp_number) {
            filters.status.add("SEM CCP");

        } else if(item.failure) {
            filters.status.add("FALHA");

        } else if(item.debits.length) {
            filters.status.add("PENDENTES");
            
        } else if(!item.debits.length) {
            filters.status.add(item.licenses_sent ? "ENVIADO" : "SEM PENDÊNCIAS");
        }
    })

    Object.entries(filters).forEach(([key, value]) => filters[key] = Array.from(value));

    return filters;
}

export { getCCP };
