import { Router } from 'express'
import { getAllTPI, insertSentYear, deleteSentYear } from './consulta-tpi.controller.js';

const router = Router();

router.get('/', getAllTPI);

router.post("/", insertSentYear);

router.delete("/", deleteSentYear);

export default router;