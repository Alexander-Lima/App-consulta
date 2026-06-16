import { Router } from 'express'
import { getCCPData, insertSentDuamCCP, setLicensesSentCCP, deleteSentDuamCCP } from './consulta-ccp.controller.js'
const router = Router();

router.get('/', getCCPData);

router.post('/', insertSentDuamCCP);

router.put('/', setLicensesSentCCP);

router.delete('/', deleteSentDuamCCP);

export default router;