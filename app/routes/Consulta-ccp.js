const axios = require('axios').default

module.exports = function (app) {
    app.get('/consulta-ccp', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const getCCP = app.app.services.ConsultaCCPService.getCCP
        try {
            const data = await getCCP(DAO)
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.render('consulta-ccp', { results : data })
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.post('/consulta-ccp', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.insertSentDuam(req.body)
            res.status(201).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.put('/consulta-ccp', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            const { id, status } = req.query
            if(id && status) {
                await DAO.setLicensesSent(id, status)
                return res.status(200).end()
            }
            return res.status(400).end("Parâmetros da requisição incorretos!")
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.delete('/consulta-ccp', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.deleteSentDuam(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })
}