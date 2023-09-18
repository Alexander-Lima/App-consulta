module.exports = function (app) {
    app.get('/cnpjs-crud', async (req, res) => {
        if(req.session.userId) {
            const db = app.config.database.databaseConnection.db()
            const DAO = new app.app.models.DAO(db)

            try {
                const result = await DAO.getAllJoinCCP()
                res.status(200)
                res.render("./cnpjs-crud", { results : result })
                res.end()

            } catch (e) {
                res.status(400)
                res.end(e)
            }

        } else {
            res.redirect('/login')
        }
    })
    
    app.patch('/cnpjs-crud/toggle-status/', async (req, res) => {
        if(req.session.userId) {
            const db = app.config.database.databaseConnection.db()
            const DAO = new app.app.models.DAO(db)
            try {
                await DAO.toggleStatus(req.body)
                res.status(200)
                res.end()
    
            } catch (e) {
                res.status(400)
                res.end(e)
            }

        } else {
            res.status(400)
            res.end("Usuário não está logado!")
        }
    })
    app.patch('/cnpjs-crud', async (req, res) => {
        if(req.session.userId) {
            const db = app.config.database.databaseConnection.db()
            const DAO = new app.app.models.DAO(db)
    
            try {
                await DAO.updateItem(req.body)
                res.status(200)
                res.end()
    
            } catch (e) {
                res.status(400)
                res.end(e)
            }

        } else {
            res.status(400)
            res.end("Usuário não está logado!")
        }
    })


    app.post('/cnpjs-crud', async (req, res) => {
        if(req.session.userId) {
            const db = app.config.database.databaseConnection.db()
            const DAO = new app.app.models.DAO(db)
            try {
                await DAO.insertItem(req.body)
                res.status(200)
                res.end()
    
            } catch (e) {
                res.status(400)
                res.end(e)
            }
        } else {
            res.status(400)
            res.end("Usuário não está logado!")
        }
    })

    app.delete('/cnpjs-crud', async (req, res) => {
        if(req.session.userId) {
            const db = app.config.database.databaseConnection.db()
            const DAO = new app.app.models.DAO(db)
    
            try {
                await DAO.deleteItems(req.body)
                res.status(200)
                res.end()
            } catch (e) {
                res.status(400)
                res.end(e)
            }

        } else {
            res.status(400)
            res.end("Usuário não está logado!")
        }
    })
}


            
            