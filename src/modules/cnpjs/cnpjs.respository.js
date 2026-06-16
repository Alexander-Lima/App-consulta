import { normalizeName, sanitizeCNPJ } from '../../utilities/util.js'
import db from '../../../config/db.js'

async function getAllJoinCCP() {
    const query = `SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.status, cnpj.comment_id, cnpj.municipio, 
    cnpj.licenses_sent, ccp.ccp_number, comments.comment_text, duam_ccp.duams FROM appconsulta.cnpj as cnpj LEFT OUTER 
    JOIN appconsulta.ccp as ccp on cnpj.id=ccp.trackcnpj LEFT JOIN appconsulta.comments as comments ON comments.id=cnpj.comment_id 
    LEFT JOIN (SELECT cnpj_id, array_agg(duam) as duams from appconsulta.duam_ccp group by cnpj_id) as duam_ccp 
    on duam_ccp.cnpj_id=cnpj.id ORDER BY cnpj.nome_empresa;`
    
    return (await db.query(query)).rows
}

async function updateItem(data) {
    const { cnpjId, cnpj, ccp, name, municipio, comments } = data
    const queryDeleteComment= "DELETE FROM appconsulta.comments WHERE id= $1;"
    const queryDeleteCommentCnpj = "UPDATE appconsulta.cnpj SET comment_id=NULL WHERE id= $1;"
    const queryDeleteCCP  = "DELETE FROM appconsulta.ccp WHERE TRACKCNPJ= $1;"
    const queryUpdateCNPJ = 
        `UPDATE appconsulta.cnpj SET cnpj= $1, nome_empresa= $2, municipio= $3, comment_id= $4,
        last_update=CURRENT_TIMESTAMP WHERE ID= $5;`

    const queryCNPJParams = [
        sanitizeCNPJ(cnpj),
        normalizeName(name),
        normalizeName(municipio),
        comments ? cnpjId : null,
        cnpjId
    ]

    await db.query("BEGIN;")

    if(comments){
        await updateOrInsertComments(cnpjId, comments)
    } else {
        await db.query(queryDeleteCommentCnpj, [cnpjId])
        await db.query(queryDeleteComment, [cnpjId])
    }
    
    if(ccp) {
        await updateOrInsertccp(cnpjId, ccp)
    } else {
        await db.query(queryDeleteCCP, [cnpjId])
    }

    await db.query(queryUpdateCNPJ, queryCNPJParams)
    await db.query("END;")
}

async function updateOrInsertComments(cnpjId, comments) {
    const queryFindComment = "SELECT * FROM appconsulta.comments WHERE id= $1;"
    const queryUpdateComments = "UPDATE appconsulta.comments SET comment_text= $2 WHERE id= $1;"
    const queryInsertComments = "INSERT INTO appconsulta.comments VALUES ($1, $2);"
    const queryUpdateCommentCnpj = "UPDATE appconsulta.cnpj SET comment_id= $1 WHERE id= $1;"
    const commentExists = (await db.query(queryFindComment, [cnpjId])).rows.length > 0

    if(commentExists) {
        await db.query(queryUpdateComments, [cnpjId, comments])
    } else {
        await db.query(queryInsertComments, [cnpjId, comments])
        await db.query(queryUpdateCommentCnpj, [cnpjId])
    }
}

async function updateOrInsertccp(cnpjId, ccp) {
    const queryFindCCP = "SELECT * FROM appconsulta.ccp WHERE trackcnpj= $1;"
    const queryUpdateCCP = "UPDATE appconsulta.ccp SET ccp_number= $2 WHERE TRACKCNPJ= $1;"
    const queryInsertCCP = "INSERT INTO appconsulta.ccp VALUES (DEFAULT, $1, $2);"
    const ccpExists = (await db.query(queryFindCCP, [cnpjId])).rows.length > 0

    if(ccpExists) {
        await db.query(queryUpdateCCP, [cnpjId, ccp])
    } else {
        await db.query(queryInsertCCP, [ccp, cnpjId])
    }
}

async function toggleStatusCnpj(objArray) {
    const enabled = []
    const disabled = []

    for(const item of objArray) {
        item.newStatus === 1 ? enabled.push(parseInt(item.id)) : disabled.push(parseInt(item.id))
    }

    const placeholdersEnabled = enabled.map((curElement, index) => `$${ index + 1 }`).join(",")
    const placeholdersDisabled = disabled.map((curElement, index) => `$${ index + 1 }`).join(",")
    const queryEnableStatus = `UPDATE appconsulta.cnpj SET status=1 WHERE id IN (${placeholdersEnabled});`
    const queryDisableStatus = `UPDATE appconsulta.cnpj SET status=0 WHERE id IN (${placeholdersDisabled});`

    await db.query("BEGIN;")
    if(enabled.length > 0) {
        await db.query(queryEnableStatus, enabled)
    } 
    if(disabled.length > 0) {
        await db.query(queryDisableStatus, disabled)
    }
    await db.query("END;")
}

async function insertItem(data) {
    const { cnpj, name, municipio, ccp, comments } = data
    const queryInsertCnpj = "INSERT INTO appconsulta.cnpj VALUES (DEFAULT, $1, $2, DEFAULT, $3, DEFAULT, NULL, DEFAULT);"
    const queryInsertCnpjarams = [
        sanitizeCNPJ(cnpj),
        normalizeName(name),
        normalizeName(municipio),
    ]
    
    await db.query("BEGIN;")
    await db.query(queryInsertCnpj, queryInsertCnpjarams)

    if(ccp || comments) {
        const id = (await findCnpjId(sanitizeCNPJ(cnpj)))[0]?.id
        if(comments) {
            await updateOrInsertComments(id, comments)
        }
        if(ccp) {
            await updateOrInsertccp(id, ccp)
        }
    }
    await db.query("END;")
}

async function findCnpjId(cnpj) {
    return (await db.query("SELECT id FROM appconsulta.cnpj WHERE cnpj=$1", [cnpj])).rows
}

async function deleteItemsCnpj(data) {
    const cnpjList = data
    const placeholders = data.map((curElement, index) => `$${ index + 1}`).join(",")
    const queryDeleteCcpList = `DELETE FROM appconsulta.ccp WHERE trackcnpj IN (${placeholders});`
    const queryDeleteListCnpj = `DELETE FROM appconsulta.cnpj WHERE id IN (${placeholders});`
    const queryDeleteCommentsList = `DELETE FROM appconsulta.comments WHERE id IN (${placeholders});`
    const queryDeleteYearsTpiList = `DELETE FROM appconsulta.years_tpi WHERE trackcnpj IN (${placeholders});`
    const queryDeleteDuamCcpList = `DELETE FROM appconsulta.duam_ccp WHERE cnpj_id IN (${placeholders});`

    await db.query("BEGIN;")
    await db.query(queryDeleteCcpList, cnpjList)
    await db.query(queryDeleteDuamCcpList, cnpjList)
    await db.query(queryDeleteYearsTpiList, cnpjList)
    await db.query(queryDeleteListCnpj, cnpjList)
    await db.query(queryDeleteCommentsList, cnpjList)
    await db.query("END;")
}

export { getAllJoinCCP, updateItem, toggleStatusCnpj, insertItem, deleteItemsCnpj }
