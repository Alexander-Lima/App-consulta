module.exports = function (app) {
    app.get("/login", (req, res) => {
        if(req.session.userId) res.redirect("/cnpjs-crud")
        else res.status(200).render("login").end()
    })

    app.post("/login", async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const { user, pass } = req.body
        try {
            const result = await DAO.getUserID(user, pass)
            if (result) {
                req.session.userId = result.NAME
                res.status(200).redirect("/cnpjs-crud")
            } else res.status(400).render('login-erro').end()
        } catch (e){
            res.end(e.message ? e.message : e)
        }
    })

    app.get('/login-erro', (req, res) => {
        res.render('login-erro')
        res.status(200).end()
    })

    app.get('/logout', (req, res) => {
        req.session?.destroy()
        res.redirect("/")
    })
}