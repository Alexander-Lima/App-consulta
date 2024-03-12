const axios = require('axios').default

module.exports = function (app) {
    app.get('/consulta-ccp', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        const Service = app.app.services.ConsultaCCPService
        try {
            const data = await Service.getCCP(DAO)
            res.render('consulta-ccp', { results : data.sort((a, b) => '' + a.nome_empresa.localeCompare(b.nome_empresa)) })
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.post('/consulta-ccp', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.insertSentDuam(req.body)
            res.status(201).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.put('/consulta-ccp', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            const { id, licenseSent } = req.query
            if(id && licenseSent) {
                await DAO.setLicensesSent(id, licenseSent)
                return res.status(200).end()
            }
            return res.status(400).end("Parâmetros da requisição incorretos!")
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.delete('/consulta-ccp', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.deleteSentDuam(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })
}