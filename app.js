import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import cnpjsCrud from './src/routes/Cnpjs-crud.js'
import home from './src/routes/Home.js'
import login from './src/routes/Login.js'
import tpi from './src/routes/Consulta-tpi.js'
import ccp from './src/routes/Consulta-ccp.js'

const app = express();

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: Number(process.env.SESSION_EXPIRE_TIME_MS) },
    resave: false
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(bodyParser.json())

// set routes
app.use("/", home);
app.use("/login", login);
app.use("/cnpjs-crud", cnpjsCrud);
app.use("/consulta-tpi", tpi);
app.use("/consulta-ccp", ccp);

export default app;  
 