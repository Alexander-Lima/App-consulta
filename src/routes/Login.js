import { Router } from 'express'
import { renderLogin, authenticate, renderError, logout } from '../controllers/login.js'
import { standardJsonError } from '../utilities/util.js'

const router = Router();

router.get("/", renderLogin);

router.post("/", authenticate);

router.get('/erro', renderError)

router.get('/out', logout);

export default router;