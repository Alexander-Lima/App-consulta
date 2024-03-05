const util = require('../utilities/util').util

module.exports = function () {
    class DAO {
        constructor (dbClient) { this.dbClient = dbClient }
    }
    
    DAO.prototype.getAllJoinCCP = async function () {
        const query = "SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.status, cnpj.comment_id, cnpj.municipio,"
        + "cnpj.licenses_sent, ccp.ccp_number, comments.comment_text, duam_ccp.duam FROM appconsulta.cnpj as cnpj LEFT OUTER "
        + "JOIN appconsulta.ccp as ccp on cnpj.id=ccp.trackcnpj LEFT JOIN appconsulta.comments as comments ON comments.id=cnpj.comment_id "
        + "LEFT JOIN appconsulta.duam_ccp as duam_ccp on duam_ccp.cnpj_id=cnpj.id ORDER BY cnpj.nome_empresa;"
        return (await this.dbClient.query(query)).rows
    }
    
    DAO.prototype.getAllJoinTPI = async function () {
            const query = "SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.municipio, cnpj.comment_id,"
            + "comments.comment_text, years.sent from appconsulta.cnpj as cnpj LEFT OUTER JOIN (SELECT trackcnpj,  array_agg(year) "
            + "as sent from appconsulta.years_tpi group by trackcnpj) as years on cnpj.id=years.trackcnpj LEFT JOIN "
            + "appconsulta.comments as comments on comments.id=cnpj.comment_id order by cnpj.nome_empresa;"
            return (await this.dbClient.query(query)).rows
    }
    
    DAO.prototype.getCnpjJoinTPI = async function (id) {
        const query = "SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.municipio, cnpj.comment_id,"
            + "comments.comment_text, years.sent from (SELECT * FROM appconsulta.cnpj WHERE id=$1) as cnpj LEFT OUTER JOIN "
            + "(SELECT trackcnpj,  array_agg(year) as sent from appconsulta.years_tpi group by trackcnpj) as years "
            + "on cnpj.id=years.trackcnpj LEFT JOIN appconsulta.comments as comments on comments.id=cnpj.comment_id "
            + "order by cnpj.nome_empresa;"
        return (await this.dbClient.query(query, [id])).rows
    }
    
    DAO.prototype.updateItem = async function (data) {
        const { cnpjId, cnpj, ccp, name, municipio, comments } = data
        const queryDeleteComment= "DELETE FROM appconsulta.comments WHERE id= $1;"
        const queryDeleteCommentCnpj= "UPDATE appconsulta.cnpj SET comment_id=NULL WHERE id= $1;"
        const queryDeleteCCP  = "DELETE FROM appconsulta.ccp WHERE TRACKCNPJ= $1;"
        const queryUpdateCNPJ = "UPDATE appconsulta.cnpj SET cnpj= $1, nome_empresa= $2, municipio= $3, comment_id= $4,"
        + "last_update=CURRENT_TIMESTAMP WHERE ID= $5;" 
        const queryCNPJParams = [
            util.sanitizeCNPJ(cnpj),
            util.normalizeName(name),
            util.normalizeName(municipio),
            comments ? cnpjId : null,
            cnpjId
        ]
        await this.dbClient.query("BEGIN;")
        if(comments){
            await this.updateOrInsertComments(cnpjId, comments)
        } else {
            await this.dbClient.query(queryDeleteCommentCnpj, [cnpjId])
            await this.dbClient.query(queryDeleteComment, [cnpjId])
        }
        
        if(ccp) {
            await this.updateOrInsertccp(cnpjId, ccp)
        } else {
            await this.dbClient.query(queryDeleteCCP, [cnpjId])
        }
        await this.dbClient.query(queryUpdateCNPJ, queryCNPJParams)
        await this.dbClient.query("END;")
    }
    
    DAO.prototype.updateOrInsertComments = async function(cnpjId, comments) {
        const queryFindComment = "SELECT * FROM appconsulta.comments WHERE id= $1;"
        const queryUpdateComments = "UPDATE appconsulta.comments SET comment_text= $2 WHERE id= $1;"
        const queryInsertComments = "INSERT INTO appconsulta.comments VALUES ($1, $2);"
        const queryUpdateCommentCnpj = "UPDATE appconsulta.cnpj SET comment_id= $1 WHERE id= $1;"
        const commentExists = (await this.dbClient.query(queryFindComment, [cnpjId])).rows.length > 0

        if(commentExists) {
            await this.dbClient.query(queryUpdateComments, [cnpjId, comments])
        } else {
            await this.dbClient.query(queryInsertComments, [cnpjId, comments])
            await this.dbClient.query(queryUpdateCommentCnpj, [cnpjId])
        }
    }

    DAO.prototype.updateOrInsertccp = async function(cnpjId, ccp) {
        const queryFindCCP = "SELECT * FROM appconsulta.ccp WHERE trackcnpj= $1;"
        const queryUpdateCCP = "UPDATE appconsulta.ccp SET ccp_number= $2 WHERE TRACKCNPJ= $1;"
        const queryInsertCCP = "INSERT INTO appconsulta.ccp VALUES (DEFAULT, $1, $2);"
        const ccpExists = (await this.dbClient.query(queryFindCCP, [cnpjId])).rows.length > 0

        if(ccpExists) {
            await this.dbClient.query(queryUpdateCCP, [cnpjId, ccp])
        } else {
            await this.dbClient.query(queryInsertCCP, [ccp, cnpjId])
        }
    }

    DAO.prototype.findCnpjId = async function(cnpj) {
        return (await this.dbClient.query("SELECT id FROM appconsulta.cnpj WHERE cnpj=$1", [cnpj])).rows
    }
    
    DAO.prototype.setLicensesSent = async function (id, licenseSent) {
        const querySetLicensesSent = "UPDATE appconsulta.cnpj SET licenses_sent= $2 WHERE ID= $1;"
        await this.dbClient.query(querySetLicensesSent, [id, licenseSent])
    }
    
    DAO.prototype.insertItem = async function (data) {
        const { cnpj, name, municipio, ccp, comments } = data
        const queryInsertCnpj = "INSERT INTO appconsulta.cnpj VALUES (DEFAULT, $1, $2, DEFAULT, $3, DEFAULT, NULL, DEFAULT);"
        const queryInsertCnpjarams = [
            util.sanitizeCNPJ(cnpj),
            util.normalizeName(name),
            util.normalizeName(municipio),
        ]
        await this.dbClient.query("BEGIN;")
        await this.dbClient.query(queryInsertCnpj, queryInsertCnpjarams)

        if(ccp || comments) {
            const id = (await this.findCnpjId(util.sanitizeCNPJ(cnpj)))[0]?.id
            if(comments) {
                await this.updateOrInsertComments(id, comments)
            }
            if(ccp) {
                await this.updateOrInsertccp(id, ccp)
            }
        }
        await this.dbClient.query("END;")
    }
    
    DAO.prototype.deleteItems = async function (data) {
        const cnpjList = data
        const placeholders = data.map((curElement, index) => `$${ index + 1}`).join(",")
        const queryDeleteCcpList = `DELETE FROM appconsulta.ccp WHERE trackcnpj IN (${placeholders});`
        const queryDeleteListCnpj = `DELETE FROM appconsulta.cnpj WHERE id IN (${placeholders});`
        const queryDeleteCommentsList = `DELETE FROM appconsulta.comments WHERE id IN (${placeholders});`

        await this.dbClient.query("BEGIN;")
        await this.dbClient.query(queryDeleteCcpList, cnpjList)
        await this.dbClient.query(queryDeleteListCnpj, cnpjList)
        await this.dbClient.query(queryDeleteCommentsList, cnpjList)
        await this.dbClient.query("END;")
    }
    
    DAO.prototype.insertSentYearTPI = async function (data) {
        const { id, year } = data
        const queryInsertYearsTpi = "INSERT INTO appconsulta.years_tpi VALUES(default, $2, $1);"
        await this.dbClient.query(queryInsertYearsTpi, [id, year])
    }
    
    DAO.prototype.deleteSentYearTPI = async function (data) {
        const { id, year } = data
        const queryDeleteSentYearsTpi = `DELETE FROM appconsulta.years_tpi WHERE year= $2 AND trackcnpj= $1;`
        await this.dbClient.query(queryDeleteSentYearsTpi, [id, year])
    }
    
    DAO.prototype.insertOrUpdateSentDuam = async function (data) {
        const { id, duam } = data
        const queryInsertDuam = "INSERT INTO appconsulta.duam_ccp VALUES(default, $1, $2);"
        const queryUpdateDuam = "UPDATE appconsulta.duam_ccp SET duam=$1 WHERE cnpj_id=$2;"
        const objExists = await this.findDuamByCnpjId(id)

        if(objExists.length > 0) {
            const isDuamAlreadyInserted = objExists[0]?.duam?.includes(duam)
            if(isDuamAlreadyInserted) {
                return
            }
            const newDuams = [...objExists[0]?.duam?.split("|"), duam]
            return await this.dbClient.query(queryUpdateDuam, [newDuams.join("|"), id])
        }
        await this.dbClient.query(queryInsertDuam, [duam, id])
    }
    
    DAO.prototype.deleteSentDuam = async function (data) {
        const { id, duam } = data
        const queryDeleteDuam = "DELETE FROM appconsulta.duam_ccp WHERE cnpj_id=$1;"
        const queryUpdateDuam = "UPDATE appconsulta.duam_ccp SET duam=$1 WHERE cnpj_id=$2;"
        const objExists = await this.findDuamByCnpjId(id)

        if(!objExists) {
            return
        }
        const duamsArray = objExists[0]?.duam?.split("|")
        const duamExists = duamsArray.includes(duam.toString())
        if(!duamExists) {
            return
        }
        const newDuamsArray = duamsArray.filter(currentDuam => currentDuam !== duam.toString())
        if(newDuamsArray.length === 0) {
            return await this.dbClient.query(queryDeleteDuam, [id])
        }
        await this.dbClient.query(queryUpdateDuam, [newDuamsArray.join("|"), id])
    }

    DAO.prototype.findDuamByCnpjId = async function (id) {
        const findId = "SELECT * FROM appconsulta.duam_ccp WHERE cnpj_id=$1;"
        return (await this.dbClient.query(findId, [id])).rows
    }
    
    DAO.prototype.getUserPasswordHash = async function (user) {
        const queryGetUser = "SELECT * FROM appconsulta.users WHERE name= $1;"
        const result = (await this.dbClient.query(queryGetUser, [user])).rows
        return result[0]
    }
    
    DAO.prototype.toggleStatus = async function (objArray) {
        const enabled = []
        const disabled = []
        for(item of objArray) {
            item.newStatus === 1 ? enabled.push(parseInt(item.id)) : disabled.push(parseInt(item.id))
        }
        const placeholdersEnabled = enabled.map((curElement, index) => `$${ index + 1}`).join(",")
        const placeholdersDisabled = disabled.map((curElement, index) => `$${ index + 1}`).join(",")
        const queryEnableStatus = `UPDATE appconsulta.cnpj SET status=1 WHERE id IN (${placeholdersEnabled});`
        const queryDisableStatus = `UPDATE appconsulta.cnpj SET status=0 WHERE id IN (${placeholdersDisabled});`

        await this.dbClient.query("BEGIN;")
        if(enabled.length > 0) {
            await this.dbClient.query(queryEnableStatus, enabled)
        } 
        if(disabled.length > 0) {
            await this.dbClient.query(queryDisableStatus, disabled)
        }
        await this.dbClient.query("END;")
    }
    return DAO
}