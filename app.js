import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import cnpjsCrud from './src/routes/Cnpjs-crud.js'
import home from './src/routes/Home.js'
import login from './src/routes/Login.js'
import tpi from './src/routes/Consulta-tpi.js'
import ccp from './src/routes/Consulta-ccp.js'

import { Router } from 'express'

const app = express();
const masterRouter = Router();

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use('/app-consulta', express.static('./public'));
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
masterRouter.use("/", home);
masterRouter.use("/login", login);
masterRouter.use("/cnpjs-crud", cnpjsCrud);
masterRouter.use("/consulta-tpi", tpi);
masterRouter.use("/consulta-ccp", ccp);

app.use("/app-consulta", masterRouter);

export default app;  
 