import { standardJsonError } from '../utilities/util.js'
import authService from '../services/authenticationService.js'

function renderLogin(req, res) {
    res.render("login");
}

async function authenticate(req, res) {
    const { user, pass } = req.body;

    try {
        const authenticationResult = await authService(user, pass);

        if (authenticationResult) {
            req.session.userId = user;
            res.redirect("cnpjs-crud");

        } else {
            res.redirect("./login/erro");
        }

    } catch (e){
        return standardJsonError(res, e);
    }
}

function renderError(req, res) {
    res.render("login-erro");
}

function logout(req, res) {
    req.session?.destroy();
    res.redirect(".");
}

export { renderLogin, authenticate, renderError, logout }