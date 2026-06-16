import { Router } from 'express'
import { renderLogin, authenticate, renderError, logout } from './auth.controller.js'

const router = Router();

router.get("/", renderLogin);

router.post("/", authenticate);

router.get('/erro', renderError)

router.get('/out', logout);

export default router;