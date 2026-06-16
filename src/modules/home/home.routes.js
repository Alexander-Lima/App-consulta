import { Router } from 'express'
import renderHome from './home.controller.js';

const router = Router();

router.get("/", renderHome);

export default router;