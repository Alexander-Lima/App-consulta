import { Router } from 'express'
import { standardJsonError } from '../utilities/util.js'
import { getAllTPI, insertSentYear, deleteSentYear } from '../controllers/consulta-tpi.js';

const router = Router();

router.get('/', getAllTPI);

router.post("/", insertSentYear);

router.delete("/", deleteSentYear);

export default router;