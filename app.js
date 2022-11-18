const app = require('./config/server')
const consign = require('consign');

consign()
    .include('./app/routes')
    .then('./config/database/databaseConnection.js')
    .then('./app/models')
    .into(app)

// module.exports = app         
 