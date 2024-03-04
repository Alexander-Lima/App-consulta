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
    
    DAO.prototype.insertSentYearTPI = function (data) {
        const { id, year } = data
        const query = "INSERT INTO YEARS_TPI VALUES(default, $1, $2);"
        return this.execQuery(sql, [year, id], "Falha ao inserir o ano na tabela!")
    }
    
    DAO.prototype.deleteSentYearTPI = function (data) {
        const { id, year } = data
        const query = `DELETE FROM YEARS_TPI WHERE YEAR= $1 AND TRACKCNPJ= $2;`
        return this.execQuery(sql, [year, id], "Falha ao deletar o ano da tabela!")
    }
    
    DAO.prototype.insertSentDuam = async function (data) {
        const { id, duam } = data
        const findId = "SELECT * FROM DUAM_CCP WHERE CNPJ_ID=$1;"
        const queryInsertDuam = "INSERT INTO DUAM_CCP VALUES(default, $1, $2);"
        const queryUpdateDuam = "UPDATE DUAM_CCP SET DUAM=$1 WHERE CNPJ_ID=$2;"
        const objExists = await this.findOne(findId, [id], "Falha ao buscar DUAM!");
        if(objExists) {
            const isDuamAlreadyInserted = objExists.DUAM.includes(duam)
            if(isDuamAlreadyInserted) return
            const newDuams = [...objExists.DUAM.split(";"), duam]
            return this.execQuery(sqlUpdateDuam, [newDuams.join(";"), id], "Falha ao inserir DUAM na tabela!")
        }
        return this.execQuery(sqlInsertDuam, [duam, id], "Falha ao inserir DUAM na tabela!")
    }
    
    DAO.prototype.deleteSentDuam = async function (data) {
        const { id, duam } = data
        const findId = "SELECT * FROM DUAM_CCP WHERE CNPJ_ID=$1;"
        const objExists = await this.findOne(findId, [id], "Falha ao buscar DUAM!");
        const queryDeleteDuam = "DELETE FROM DUAM_CCP WHERE CNPJ_ID=$1;"
        const queryUpdateDuam = "UPDATE DUAM_CCP SET DUAM=$1 WHERE CNPJ_ID=$2;"
        if(!objExists) return
        const duamsArray = objExists.DUAM?.split(";")
        const duamExists = duamsArray.includes(duam.toString())
        if(!duamExists) return
        const newDuamsArray = duamsArray.filter(currentDuam => currentDuam !== duam.toString())
        if(newDuamsArray.length === 0) return this.execQuery(sqlDeleteDuam, [id], "Falha ao deletar DUAM na tabela!")
        return this.execQuery(sqlUpdateDuam, [newDuamsArray.join(";"), id], "Falha ao deletar DUAM na tabela!")
    }
    
    DAO.prototype.getUserPasswordHash = async function (user) {
        const query = "SELECT * FROM USERS WHERE NAME= $1;"
        return this.findOne(sql, [user], "Usuário não encontrado!")
    }
    
    DAO.prototype.toggleStatus = function (objArray) {
        return new Promise(async (res, rej) => {
            const enabled = []
            const disabled = []
            for(item of objArray) {
                item.newStatus === 1 ? enabled.push(item.id) : disabled.push(item.id)
            }
            const queryEnabled = `UPDATE CNPJ SET STATUS=1 WHERE ID IN ($1);`
            const queryDisabled = `UPDATE CNPJ SET STATUS=0 WHERE ID IN ($1);`
    
            try {
                this.dbClient.exec("BEGIN TRANSACTION;")
                if(enabled) await this.execQuery(sqlEnabled, [enabled.join(",")], "Falha ao alterar status de itens ativos!")
                if(disabled) await this.execQuery(sqlDisabled, [disabled.join(",")], "Falha ao alterar status de itens inativos!")
                this.dbClient.exec("END TRANSACTION;")
                res()
            } catch (err) {
                rej(err.message)
            }
        })
    }
    return DAO
}