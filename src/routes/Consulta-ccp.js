import { Router } from 'express'
import DAO from '../models/DAO.js'
import getCCP from '../services/ConsultaCCPService.js';
import { standardJsonError } from '../utilities/util.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { data, filters } = await getCCP();

        res.render(
            'consulta-ccp',
            { 
                data: data.sort((a, b) => '' + a.nome_empresa.localeCompare(b.nome_empresa)),
                filters: filters
            });

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.post('/', async (req, res) => {
    try {
        await DAO.insertSentDuam(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.put('/', async (req, res) => {
    try {
        const { id, licenseSent } = req.query;
        if(id && licenseSent) {
            await DAO.setLicensesSent(id, licenseSent);
            return res.status(200).end();
        }

        return res.status(400).end("Parâmetros da requisição incorretos!");

    } catch (e) {
         return standardJsonError(res, e);
    }
})

router.delete('/', async (req, res) => {
    try {
        await DAO.deleteSentDuam(req.body);
        res.end();
        
    } catch (e) {
         return standardJsonError(res, e);
    }
})

export default router;