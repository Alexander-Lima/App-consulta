module.exports = function (app) {
    const DEBUG = false;
    app.get('/cnpjs-crud', async (req, res) => {
        const dbClient = await app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            const result = await DAO.getAllJoinCCP()
            res.render("./cnpjs-crud", { results : result })
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.put('/cnpjs-crud', async (req, res) => {
        const dbClient = app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.updateItem(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })
    
    app.put('/cnpjs-crud/toggle-status/', async (req, res) => {
        const dbClient = app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.toggleStatus(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.post('/cnpjs-crud', async (req, res) => {
        const dbClient = app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.insertItem(req.body)
            res.status(201).end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })

    app.delete('/cnpjs-crud', async (req, res) => {
        const dbClient = app.config.database.databaseConnection.openClient()
        const DAO = new app.app.models.DAO(dbClient)
        try {
            await DAO.deleteItems(req.body)
            res.status(200)
            res.end()
        } catch (e) {
            res.status(400).end(JSON.stringify({error: e?.message ? e.message : "unknown"}))
        }
    })
}


            
            