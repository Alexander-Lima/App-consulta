import { Router } from 'express'
import { listCNPJ, update, toggleStatus, insert, deleteItems } from '../controllers/cnpjs-crud.js';

const router = Router();

router.get('/', listCNPJ);

router.put('/', update);

router.put('/toggle-status', toggleStatus);

router.post('/', insert);

router.delete('/', deleteItems)

export default router;



        
        