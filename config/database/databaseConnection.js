const { Client } = require('pg');

module.exports = function () {
    this.openClient = async function () {
        const client = new Client({
            user: process.env.POSTGRES_USER,
            host: '192.168.1.203',
            database: 'postgres',
            password: process.env.POSTGRES_PASS,
            port: '5432'
        })
        await client.connect()
        return client
    }
    return this
}


