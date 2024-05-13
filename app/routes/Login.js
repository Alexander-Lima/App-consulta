
module.exports = function (app) {
    app.get("/login", (req, res) => {
        res.status(200).render("login")
    })

    app.post("/login", async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        const Service = app.app.services.AuthenticationService
        const { user, pass } = req.body
        try {
            const authenticationResult = await Service.authenticate(DAO, user, pass)
            if (authenticationResult) {
                req.session.userId = user
                res.status(200).redirect("/cnpjs-crud")
            } else {
                res.status(400).render("login-erro")
            }
        } catch (e){
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.get('/login-erro', (req, res) => {
        res.render("login-erro")
        res.status(200).end()
    })

    app.get('/logout', (req, res) => {
        req.session?.destroy()
        res.redirect("/")
    })
}