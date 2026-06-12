import { Router } from 'express'
import DAO from '../models/DAO.js'
import authMiddleware from '../middlewares/auth.js'
import { standardJsonError } from '../utilities/util.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await DAO.getAllJoinCCP();
        res.render("./cnpjs-crud", { results : result });

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.put('/', authMiddleware, async (req, res) => {
    try {
        await DAO.updateItem(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.put('/toggle-status', authMiddleware, async (req, res) => {
    try {
        await DAO.toggleStatus(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.post('/', authMiddleware, async (req, res) => {
    try {
        await DAO.insertItem(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
})

router.delete('/', authMiddleware, async (req, res) => {
    try {
        await DAO.deleteItems(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
})

export default router;



        
        