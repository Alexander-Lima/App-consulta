import { standardJsonError } from '../utilities/util.js'
import { getCnpjJoinTPI, getAllJoinTPI, insertSentYearTPI, deleteSentYearTPI } from '../respositories/consulta-tpi.js';
import getTPI from '../services/consultaTPIService.js';

async function getAllTPI(req, res) {
    try {
        const { id } = req.query;

        if(id) {
            const cnpj = await getCnpjJoinTPI(id);
            const [data] = await getTPI(cnpj);
            return res.send(data);
        } 
       
        const cnpjList = await getAllJoinTPI();
        const data = await getTPI(cnpjList);
        res.render("consulta-tpi", { cnpjs: data, today: new Date() });
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insertSentYear(req, res) {
    try {
        await insertSentYearTPI(req.body)
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function deleteSentYear(req, res) {
    try {
        await deleteSentYearTPI(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

export { getAllTPI, insertSentYear, deleteSentYear }