const { Client } = require('pg');

module.exports = function () {
    this.openClient = async function () {
        const client = new Client({
            user: 'postgres',
            host: '192.168.1.203',
            database: 'postgres',
            password: '172125',
            port: '5432'
        })
        await client.connect()
        return client
    }
    return this
}


