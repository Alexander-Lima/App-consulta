require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const sessions = require('express-session')
const app = express();

app.set('view engine', 'ejs');
app.set('views', './app/views');
app.use(express.static('public'));
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: Number(process.env.SESSION_EXPIRE_TIME_MS) },
    resave: false
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(bodyParser.json())
app.listen(process.env.APP_PORT, process.env.APP_IP, () => {
    console.log(`Aplicação de Consultas Prefeitura e Sicabom está rodando em ${process.env.APP_IP}:${process.env.APP_PORT}`)
});

module.exports = app   
  