import { executeQueryFunction, withTransaction }  from '../../../config/db.js'

async function getAllJoinCCP() {
    const query = `SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.status, cnpj.comment_id, cnpj.municipio, 
    cnpj.licenses_sent, ccp.ccp_number, comments.comment_text, duam_ccp.duams FROM appconsulta.cnpj as cnpj LEFT OUTER 
    JOIN appconsulta.ccp as ccp on cnpj.id=ccp.trackcnpj LEFT JOIN appconsulta.comments as comments ON comments.id=cnpj.comment_id 
    LEFT JOIN (SELECT cnpj_id, array_agg(duam) as duams from appconsulta.duam_ccp group by cnpj_id) as duam_ccp 
    on duam_ccp.cnpj_id=cnpj.id ORDER BY cnpj.nome_empresa;`;
    
    return (await executeQueryFunction(async (db) => db.query(query))).rows;
}

async function insertSentDuam(data) {
    const { id, duam } = data;
    const queryInsertDuam = "INSERT INTO appconsulta.duam_ccp VALUES(default, $1, $2);";

    await executeQueryFunction(async (db) => db.query(queryInsertDuam, [duam, id]));
}

async function setLicensesSent(id, licenseSent) {
    const querySetLicensesSent = "UPDATE appconsulta.cnpj SET licenses_sent= $2 WHERE ID= $1;";

    await executeQueryFunction(async (db) => db.query(querySetLicensesSent, [id, licenseSent]));
}

async function deleteSentDuam(data) {
    const { id, duam } = data
    const queryDeleteDuam = "DELETE FROM appconsulta.duam_ccp WHERE cnpj_id=$1 AND duam=$2;";

    await executeQueryFunction(async (db) => db.query(queryDeleteDuam, [id, duam]));
}

export { getAllJoinCCP, insertSentDuam, setLicensesSent, deleteSentDuam }
