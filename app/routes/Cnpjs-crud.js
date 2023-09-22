module.exports = function (app) {
    const DEBUG = false;
    app.get('/cnpjs-crud', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            const result = await DAO.getAllJoinCCP()
            res.render("./cnpjs-crud", { results : result })
            res.status(200).end()
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })

    app.put('/cnpjs-crud', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.updateItem(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })
    
    app.put('/cnpjs-crud/toggle-status/', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.toggleStatus(req.body)
            res.status(200).end()
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })

    app.post('/cnpjs-crud', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.insertItem(req.body)
            res.status(201).end()
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })

    app.delete('/cnpjs-crud', async (req, res) => {
        const db = app.config.database.databaseConnection.db()
        const DAO = new app.app.models.DAO(db)
        try {
            await DAO.deleteItems(req.body)
            res.status(200)
            res.end()
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })
}


            
            