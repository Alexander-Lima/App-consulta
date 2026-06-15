import { Router } from 'express'
import { standardJsonError } from '../utilities/util.js'
import { getCCPData, insertSentDuamCCP, setLicensesSentCCP, deleteSentDuamCCP } from '../controllers/consulta-ccp.js';

const router = Router();

router.get('/', getCCPData);

router.post('/', insertSentDuamCCP);

router.put('/', setLicensesSentCCP);

router.delete('/', deleteSentDuamCCP);

export default router;