import { Router } from 'express'
import { updateData } from './relatorio-cnpj.controller.js';

const router = Router();

router.get('/update', updateData);

export default router;



        
        