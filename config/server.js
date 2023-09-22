const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const ip = require('ip')
const sessions = require('express-session')
const oneHour = 1000 * 60 * 60;
const authorizationMiddleware = (req, res, next) => {
    const DEBUG = false
    let { userId } = req.session
    const { url, method } = req
    if(DEBUG) userId = "DEBUG"
    if(url.startsWith("/login") && method == "GET") {
        if(userId) return res.redirect("/cnpjs-crud")
        return next() 
    }
    if(url.startsWith("/cnpjs-crud")) {
        if(!userId && method === "GET") return res.redirect("/login")
        if(!userId) return res.status(400).end("Usuário não está logado!")
        return next()
    }
    next()
}
app.set('view engine', 'ejs');
app.set('views', './app/views');
app.use(express.static('public'));
app.use(sessions({
    secret: "AJSjsalPOnnjauytuos",
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}))
app.use(authorizationMiddleware);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(bodyParser.json())
app.listen(8080, ip.address(), () => { console.log("Aplicação de Consultas Prefeitura e Sicabom está rodando...") });

module.exports = app   
  