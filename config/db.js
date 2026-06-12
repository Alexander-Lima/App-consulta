import { Pool } from "pg";

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.POSTGRES_PASS,
    port: process.env.DB_PORT,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000
})

export default pool;

