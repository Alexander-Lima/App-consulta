const axios = require('axios').default
const formData = require('form-data')

module.exports = function (app) {
    app.get('/consulta-tpi', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const Model = app.app.models.ModelConsultaTPI
        const todayDate = new Date().getTime()

        try {
            const cnpjList = await DAO.getAllCNPJ()
            const data = await Model.getTPI(cnpjList)
            res.status(200)
            res.setHeader("Access-Control-Allow-Origin", "*")
            // res.send(data)
            res.render("./consulta-tpi", { cnpjs: data, today: todayDate} )
            res.end()

        } catch (e) {
            res.status(400)
            res.end(e.message ? e.message : e)
        }
    })

    app.post('/consulta-tpi/individual', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const Model = app.app.models.ModelConsultaTPIindividual

         try {
            const yearsSent = await DAO.getSentYears(req.query.id)
            const data = await Model.updateItem(req.query.cnpj, yearsSent)

            res.status(200)
            res.send(data)
            res.end()

         } catch (e) {
             res.status(400)
             res.end(e.message ? e.message : e)
         }
     })

     app.post("/consulta-tpi/marcar", async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)

        try {
            await DAO.insertSentYear(req.body)
            res.end()

        } catch (e) {
            res.status(400)
            res.end(e.message ? e.message : e)
        }
    })

    app.delete("/consulta-tpi", async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)

        try {
            await DAO.deleteSentYear(req.body)
            res.end()

        } catch (e) {
            res.status(400)
            res.end(e.message ? e.message : e)
        }
    })

}