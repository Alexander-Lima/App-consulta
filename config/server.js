const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const ip = require('ip')
const sessions = require('express-session')
const oneHour = 1000 * 60 * 60;

app.set('view engine', 'ejs');
app.set('views', './app/views');
app.use(express.static('public'));
app.use(sessions({
    secret: "mysecretsession10293jjglotkl",
    saveUninitialized: true,
    cookie: { maxAge: oneHour},
    resave: false
}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(bodyParser.json())


app.listen(8080, ip.address(), () => {console.log("Aplicação Consulta Sicabom está rodando...")});

module.exports = app   
  