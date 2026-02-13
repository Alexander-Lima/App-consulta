module.exports = (req, res, next) => {
    const isAuthenticated = Boolean(process.env.DEBUG == 'true' || req.session.userId)

    if(isAuthenticated) { 
        return next()
    }

    if(req.method === "GET" ) {
        return res.redirect("/app-consulta/login")
    }

    return res.status(400).end("Usuário não está logado!")
}
