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
        const queryFindComment = "SELECT * FROM appconsulta.comments WHERE id= $1;"
        const queryUpdateComments = "UPDATE appconsulta.comments SET comment_text= $2 WHERE id= $1;"
        const queryInsertComments = "INSERT INTO appconsulta.comments VALUES ($1, $2);"
        const queryDeleteComment= "DELETE FROM appconsulta.comments WHERE id= $1;"
        const queryDeleteCommentCnpj= "UPDATE appconsulta.cnpj SET comment_id=NULL WHERE id= $1;"
        const queryFindCCP = "SELECT * FROM appconsulta.ccp WHERE trackcnpj= $1;"
        const queryUpdateCCP = "UPDATE appconsulta.ccp SET ccp_number= $2 WHERE TRACKCNPJ= $1;"
        const queryInsertCCP = "INSERT INTO appconsulta.ccp VALUES (DEFAULT, $1, $2);"
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
            const commentExists = (await this.dbClient.query(queryFindComment, [cnpjId])).rows.length > 0
            if(commentExists) {
                await this.dbClient.query(queryUpdateComments, [cnpjId, comments])
            } else {
                await this.dbClient.query(queryInsertComments, [cnpjId, comments])
            }
        } else {
            await this.dbClient.query(queryDeleteCommentCnpj, [cnpjId])
            await this.dbClient.query(queryDeleteComment, [cnpjId])
        }
        
        if(ccp) {
            const ccpExists = (await this.dbClient.query(queryFindCCP, [cnpjId])).rows.length > 0
            if(ccpExists) {
                await this.dbClient.query(queryUpdateCCP, [cnpjId, ccp])
            } else {
                await this.dbClient.query(queryInsertCCP, [ccp, cnpjId])
            }
        } else {
            await this.dbClient.query(queryDeleteCCP, [cnpjId])
        }
        await this.dbClient.query(queryUpdateCNPJ, queryCNPJParams)
        await this.dbClient.query("END;")
    }
    
    DAO.prototype.setLicensesSent = function (id, status) {
        return new Promise (async (res, rej) => {
            try {
                const querySetLicensesSent = "UPDATE CNPJ SET LICENSES_SENT= $1 WHERE ID= $2;"
               
                this.dbClient.exec("BEGIN TRANSACTION;")
                await this.execQuery(sqlSetLicensesSent, [status, id], "Falha ao atualizar alvarás enviados!")
                this.dbClient.exec("END TRANSACTION;")
                res()
            } catch (e) {
                rej(e.message ? e.message : e)
            }
        })
    }
    
    DAO.prototype.insertItem = function (data) {
        return new Promise(async (res, rej) => {
            try {
                const { cnpj, name, municipio, ccp, comments } = data
                const queryCNPJ = "INSERT INTO CNPJ VALUES (default, $1, $2, datetime(CURRENT_TIMESTAMP, 'localtime'), "
                                + "$3, 1, default, 0);"
                const queryUpdateCNPJ = "UPDATE CNPJ SET COMMENT_ID= $1 WHERE ID= $2"
                const queryComments = "INSERT INTO COMMENTS VALUES($1, $2);"
                const queryInsertCCP = "INSERT INTO CCP VALUES (default, $1, $2);"
                const queryCNPJParams = [
                    util.sanitizeCNPJ(cnpj),
                    util.normalizeName(name),
                    util.normalizeName(municipio),
                ]
                this.dbClient.exec("BEGIN TRANSACTION;")
                const id = await this.insertReturningId(sqlCNPJ, sqlCNPJParams, "Falha ao inserir CNPJ!")
                if(comments) {
                    await this.execQuery(sqlUpdateCNPJ, [id, id], "Falha ao atualizar CNPJ!")
                    await this.execQuery(sqlComments, [id, comments], "Falha ao inserir comentário!")
                }
                if(ccp) await this.execQuery(sqlInsertCCP, [ccp, id])
                this.dbClient.exec("END TRANSACTION;")
                res()
            } catch (e) {
                rej(e.message ? e.message : e)
            }
        })
    }
    
    DAO.prototype.deleteItems = function (data) {
        return new Promise(async (res, rej) => {
            try {
                const cnpjList = data
                const placeholders = data.map((curElement, index) => `$${ index + 1}`).join(",");
                const queryCNPJ = `DELETE FROM CNPJ WHERE ID IN (${placeholders});`
                const queryCCP = `DELETE FROM CCP WHERE TRACKCNPJ IN (${placeholders});`
                const queryComments = `DELETE FROM COMMENTS WHERE ID IN (${placeholders});`
    
                this.dbClient.exec("BEGIN TRANSACTION;")
                await this.execQuery(sqlCNPJ, cnpjList, "Falha ao deletar CNPJ!")
                await this.execQuery(sqlCCP, cnpjList, "Falha ao deletar CCP!")
                await this.execQuery(sqlComments, cnpjList, "Falha ao deletar comentários!")
                this.dbClient.exec("END TRANSACTION;")
                res()
            } catch (e) {
                rej(e.message ? e.message : e)
            }
        })
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