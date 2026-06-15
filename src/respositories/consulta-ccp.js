import db from '../../config/db.js'

async function insertSentDuam(data) {
    const { id, duam } = data
    const queryInsertDuam = "INSERT INTO appconsulta.duam_ccp VALUES(default, $1, $2);"

    await db.query(queryInsertDuam, [duam, id])
}

async function setLicensesSent(id, licenseSent) {
    const querySetLicensesSent = "UPDATE appconsulta.cnpj SET licenses_sent= $2 WHERE ID= $1;"
    await db.query(querySetLicensesSent, [id, licenseSent])
}


async function deleteSentDuam(data) {
    const { id, duam } = data
    const queryDeleteDuam = "DELETE FROM appconsulta.duam_ccp WHERE cnpj_id=$1 AND duam=$2;"

    await db.query(queryDeleteDuam, [id, duam])
}

export { insertSentDuam, setLicensesSent, deleteSentDuam }
