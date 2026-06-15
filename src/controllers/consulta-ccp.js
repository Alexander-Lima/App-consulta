import { standardJsonError } from '../utilities/util.js';
import { insertSentDuam, setLicensesSent, deleteSentDuam } from '../respositories/consulta-ccp.js'
import { getAllJoinCCP } from '../respositories/cnpjs-crud.js'
import { getCCP } from '../services/consultaCCPService.js';

async function getCCPData(req, res) {
    try {
        const ccpList = await getAllJoinCCP();
        const { data, filters } = await getCCP(ccpList);

        res.render(
            'consulta-ccp',
            { 
                data: data.sort((a, b) => '' + a.nome_empresa.localeCompare(b.nome_empresa)),
                filters: filters
            });

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insertSentDuamCCP(req, res) {
    try {
        await insertSentDuam(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function setLicensesSentCCP (req, res) {
    try {
        const { id, licenseSent } = req.query;
        if(id && licenseSent) {
            await setLicensesSent(id, licenseSent);
            return res.end();
        }

        return res.status(400).end("Parâmetros da requisição incorretos!");

    } catch (e) {
         return standardJsonError(res, e);
    }
}

async function deleteSentDuamCCP(req, res) {
    try {
        await deleteSentDuam(req.body);
        res.end();
        
    } catch (e) {
         return standardJsonError(res, e);
    }
}

export { getCCPData, insertSentDuamCCP, setLicensesSentCCP, deleteSentDuamCCP }