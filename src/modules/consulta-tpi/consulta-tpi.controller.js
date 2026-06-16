import { standardJsonError } from '../../utilities/util.js'
import { getByIdService, getAllService, insertSentYearService, deleteSentYearService } from './consulta-tpi.service.js';

async function getAllTPI(req, res) {
    try {
        const { id } = req.query;

        if(id) {
            const [result] = await getByIdService(id);
            return res.send(result);
        } 
       
        res.render(import.meta.dirname + "/views/consulta-tpi", { cnpjs: await getAllService(), today: new Date() });
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insertSentYear(req, res) {
    try {
        await insertSentYearService(req.body)
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function deleteSentYear(req, res) {
    try {
        await deleteSentYearService(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

export { getAllTPI, insertSentYear, deleteSentYear }