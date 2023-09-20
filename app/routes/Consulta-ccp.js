const axios = require('axios').default

module.exports = function (app) {
    app.get('/consulta-ccp', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        const getCCP = app.app.models.ModelConsultaCCP.getCCP

        try {
            const data = await getCCP(DAO)
            console.log(data)
            res.status(200)
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.render('consulta-ccp', { results : data })
            res.end()
        } catch (e) {
            res.status(400)
            res.end(e)
        }
    })
}