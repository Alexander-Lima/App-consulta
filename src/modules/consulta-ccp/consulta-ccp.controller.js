import { standardJsonError } from '../../utilities/util.js';
import { getAllService, insertSentDuamService, setLicenseSentService, deleteSentDuamService } from './consulta-ccp.service.js';

async function getCCPData(req, res) {
    try {
        res.render(import.meta.dirname + '/views/consulta-ccp', await getAllService());

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insertSentDuamCCP(req, res) {
    try {
        await insertSentDuamService(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function setLicensesSentCCP (req, res) {
    try {
        const { id, licenseSent } = req.query;
        if(id && licenseSent) {
            await setLicenseSentService(id, licenseSent);
            return res.end();
        }

        return res.status(400).end("Parâmetros da requisição incorretos!");

    } catch (e) {
         return standardJsonError(res, e);
    }
}

async function deleteSentDuamCCP(req, res) {
    try {
        await deleteSentDuamService(req.body);
        res.end();
        
    } catch (e) {
         return standardJsonError(res, e);
    }
}

export { getCCPData, insertSentDuamCCP, setLicensesSentCCP, deleteSentDuamCCP }