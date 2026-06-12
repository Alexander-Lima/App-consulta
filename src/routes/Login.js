import { Router } from 'express'
import DAO from '../models/DAO.js'
import auth from '../services/AuthenticationService.js'
import { standardJsonError } from '../utilities/util.js';

const router = Router();

router.get("/", (req, res) => {
    res.render("login");
})

router.post("/", async (req, res) => {
    const { user, pass } = req.body;

    try {
        const authenticationResult = await auth(user, pass);

        if (authenticationResult) {
            req.session.userId = user;
            res.redirect("/app-consulta/cnpjs-crud");

        } else {
            res.status(400).render("login-erro");
        }

    } catch (e){
        return standardJsonError(res, e);
    }
})

router.get('/erro', (req, res) => {
    res.render("login-erro");
})

router.get('/out', (req, res) => {
    req.session?.destroy();
    res.redirect("/app-consulta");
})

export default router;