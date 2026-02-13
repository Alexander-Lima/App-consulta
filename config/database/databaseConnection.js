const { Client } = require('pg');

module.exports = function () {
    this.openClient = async function() {
        const client = new Client({
            user: process.env.POSTGRES_USER,
            host: process.env.HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.POSTGRES_PASS,
            port: process.env.DB_PORT
        })
        await client.connect()
        return client
    }
    return this
}


