module.exports = function (app) {
    app.get("/login", (req, res) => {
        if(req.session.userId) {
            res.redirect("/cnpjs-crud")

        } else {
            res.status(200)
            res.render("login")
            res.end()
        }
    })

    app.post("/login", async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)

        try {
            const [result] = await DAO.getUserID(req.body.user, req.body.pass)

            if (result) {
                req.session.userId = result.NAME
                res.status(200)
                res.redirect("/cnpjs-crud")
    
            } else {
                res.status(400)
                res.render('login-erro')
            }
            res.end()
        } catch (e){
            res.end(e.message ? e.message : e)
        }
    })

    app.get('/login-erro', (req, res) => {
        res.status(200)
        res.render('login-erro')
        res.end()
    })

    app.get('/logout', (req, res) => {
        if(!req.session.userId) {res.end("Falha no logout!"); return}
        req.session.destroy()
        res.redirect("/")
    })
}