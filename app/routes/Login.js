module.exports = function (app) {
    app.get("/login", (req, res) => {
        res.status(200).render("login")
    })

    app.post("/login", async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const { user, pass } = req.body
        try {
            const userAuthenticated = await DAO.authenticate(user, pass)
            if (userAuthenticated) {
                req.session.userId = userAuthenticated.NAME
                res.status(200).redirect("/cnpjs-crud")
            } else res.status(400).render("login-erro")
        } catch (e){
            res.end(e.message ? e.message : e)
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