const axios = require('axios').default
const formData = require('form-data')

module.exports = function (app) {
    app.get('/consulta-tpi', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        const Service = app.app.services.ConsultaTPIService
        const todayDate = new Date()
        try {
            const cnpjList = await DAO.getAllJoinTPI()
            const data = await Service.getTPI(cnpjList)
            res.render("./consulta-tpi", { cnpjs: data, today: todayDate })
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.post('/consulta-tpi/individual', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        const Service = app.app.services.ConsultaTPIService
         try {
            const { id } = req.query
            const cnpj = await DAO.getCnpjJoinTPI(id)
            const [data] = await Service.getTPI(cnpj)
            res.status(200).send(data).end()
         } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
         }
     })

     app.post("/consulta-tpi", async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.insertSentYearTPI(req.body)
            res.end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.delete("/consulta-tpi", async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.deleteSentYearTPI(req.body)
            res.end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })
}