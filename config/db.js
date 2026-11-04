import { Pool } from "pg";
import { exec } from "node:child_process";

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.POSTGRES_PASS,
    port: process.env.PORT,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000
})

async function executeQueryFunction(queryFunction) {
    let client;

    try {
        client = await pool.connect();
        return await queryFunction(client);

    } catch (error) {
        if(error.code === "ECONNREFUSED") {
            restartDBService();
        }

        throw error;

    } finally {
        client?.release();
    }
}

async function withTransaction(queryFunction) {
    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN;");
        const results = await queryFunction(client);
        await client.query("END;");

        return results;
        
    } catch (error) {
        if(error.code === "ECONNREFUSED") {
            restartDBService();
        }

        throw error;

    } finally {
        client?.release();
    }
}

function restartDBService() {
    exec(`sc.exe start "postgresql16"`, (error, stdout, stderr) => {
        if (error) {
            console.error("Erro ao iniciar serviço:", stderr || error.message);
        }
    });
}

export { executeQueryFunction,  withTransaction };

