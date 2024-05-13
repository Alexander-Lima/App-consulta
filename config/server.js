const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const ip = require('ip')
const sessions = require('express-session')
const oneHour = 1000 * 60 * 60;
const port = 3000
const ipAddress = ip.address()
const authenticationMiddleware = (req, res, next) => {
    const DEBUG = false
    let { userId } = req.session
    const { url, method } = req
    if(DEBUG) userId = "DEBUG"
    if(url.startsWith("/login") && method == "GET") {
        if(userId) {
            return res.redirect("/cnpjs-crud")
        }
        return next() 
    }
    if(url.startsWith("/cnpjs-crud")) {
        if(!userId) { 
            if(method === "GET" ) {
                return res.redirect("/login")
            }
            return res.status(400).end("Usuário não está logado!")
        }
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
app.use(authenticationMiddleware);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(bodyParser.json())
app.listen(port, ipAddress, () => { console.log(`Aplicação de Consultas Prefeitura e Sicabom está rodando em ${ipAddress}:${port}`) });

module.exports = app   
  