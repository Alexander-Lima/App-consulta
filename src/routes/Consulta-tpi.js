import { Router } from 'express'
import DAO from '../models/DAO.js'
import getTPI from '../services/ConsultaTPIService.js'
import { standardJsonError } from '../utilities/util.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { id } = req.query;

        if(id) {
            const cnpj = await DAO.getCnpjJoinTPI(id);
            const [data] = await getTPI(cnpj);
            return res.send(data);
        } 
       
        const cnpjList = (await DAO.getAllJoinTPI());
        const data = await getTPI(cnpjList);
        res.render("./consulta-tpi", { cnpjs: data, today: new Date() });
        
    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.post("/", async (req, res) => {
    try {
        await DAO.insertSentYearTPI(req.body)
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.delete("/", async (req, res) => {
    try {
        await DAO.deleteSentYearTPI(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
})

export default router;