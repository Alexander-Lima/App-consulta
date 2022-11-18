module.exports = function (app) {
    app.get("/count-empresas", async (req, res) => {
        let origin = req.query.origin
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)

        try {
            const count = await DAO.getCountEmpresas(origin)
            res.status(200)
            res.send(count)
            res.end()

        } catch (e) {
            res.status(400)
            res.end(e.message ? e.message : e)
        }
    })
}