import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import cnpjs from './src/modules/cnpjs/cnpjs.routes.js'
import home from './src/modules/home/home.routes.js'
import auth from './src/modules/auth/auth.routes.js'
import tpi from './src/modules/consulta-tpi/consulta-tpi.routes.js'
import ccp from './src/modules/consulta-ccp/consulta-ccp.routes.js'
import authMiddleware from './src/middlewares/auth.middleware.js'
import { Router } from 'express'

const app = express();
const router = Router();

app.set('view engine', 'ejs');
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: Number(process.env.SESSION_EXPIRE_TIME_MS) },
    resave: false
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(bodyParser.json())

// set routes
app.use("/", home);
app.use("/login", auth);
app.use("/cnpjs-crud", authMiddleware, cnpjs);
app.use("/consulta-tpi", tpi);
app.use("/consulta-ccp", ccp);

// for local
// ####################
// app.use("/app-consulta/public", express.static('public'))

// router.use("/", home);
// router.use("/login", auth);
// router.use("/cnpjs-crud", authMiddleware, cnpjs);
// router.use("/consulta-tpi", tpi);
// router.use("/consulta-ccp", ccp);

// app.use("/app-consulta", router)
// ####################

export default app;  
 