import { executeQueryFunction }  from '../../../config/db.js'

export default async function getUserPasswordHash(user) {
    const queryGetUser = "SELECT * FROM appconsulta.users WHERE name= $1;";
    const result = (await executeQueryFunction((db) => db.query(queryGetUser, [user]))).rows;
    return result[0];
}