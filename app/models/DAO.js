const util = require('../utilities/util').util
class DAO {
    constructor (db) { this.db = db }
}

DAO.prototype.getAllJoinCCP = function () {
    const sql = "SELECT CNPJ.ID, CNPJ.STATUS, CNPJ.CNPJ, CNPJ.NOME_EMPRESA, CNPJ.STATUS, CNPJ.COMMENT_ID, CNPJ.MUNICIPIO,"
            +" CNPJ.LICENSES_SENT, CCP.CCP_NUMBER, COMMENTS.COMMENT_TEXT, DUAM_CCP.DUAM FROM CNPJ LEFT OUTER JOIN CCP ON"
            +" CNPJ.ID=CCP.TRACKCNPJ LEFT JOIN COMMENTS ON COMMENTS.ID=CNPJ.COMMENT_ID LEFT JOIN DUAM_CCP ON"
            +" DUAM_CCP.CNPJ_ID=CNPJ.ID ORDER BY CNPJ.NOME_EMPRESA;"
    return this.execQueryWithResults(sql)
}

DAO.prototype.getAllJoinTPI = function () {
        const sql = "SELECT CNPJ.ID, CNPJ.STATUS, CNPJ.CNPJ, CNPJ.NOME_EMPRESA, CNPJ.MUNICIPIO, CNPJ.COMMENT_ID," 
                +" COMMENTS.COMMENT_TEXT, YEARS.SENT FROM CNPJ LEFT OUTER JOIN (SELECT TRACKCNPJ, GROUP_CONCAT(YEAR, ';')" 
                +" AS SENT FROM YEARS_TPI GROUP BY (TRACKCNPJ)) AS YEARS ON CNPJ.ID=YEARS.TRACKCNPJ LEFT JOIN COMMENTS ON"
                +" COMMENTS.ID=CNPJ.COMMENT_ID ORDER BY CNPJ.NOME_EMPRESA;"
        return this.execQueryWithResults(sql);
}

DAO.prototype.getSentYearsTPI = function (id) {
    return new Promise((res, rej) => {
        let sql = `SELECT GROUP_CONCAT(YEAR, ';') AS SENT FROM YEARS_TPI WHERE TRACKCNPJ= ?;`

        this.db.all(sql, [id], (err, result) => {
            if(err) { rej(err); return }
            [{ SENT }] = result
            res(SENT ? {SENT : SENT.split(";")} : [])
        })
    })
}

DAO.prototype.updateItem = function (data) {
    return new Promise (async (res, rej) => {
        try {
            const { cnpjId, cnpj, ccp, name, municipio, comments } = data
            const sqlFindComment = "SELECT * FROM COMMENTS WHERE ID= ?;"
            const sqlFindCCP = "SELECT * FROM CCP WHERE TRACKCNPJ= ?;"
            const sqlUpdateComments = "UPDATE COMMENTS SET COMMENT_TEXT= ? WHERE ID= ?;"
            const sqlInsertComments = "INSERT INTO COMMENTS VALUES (?, ?);"
            const sqlInsertCCP = "INSERT INTO CCP VALUES (NULL, ?, ?);"
            const sqlCNPJ = "UPDATE CNPJ SET CNPJ= ?, NOME_EMPRESA= ?, MUNICIPIO= ?, COMMENT_ID= ?,"
			    + "TIMESTAMP=datetime(CURRENT_TIMESTAMP, 'localtime') WHERE ID= ?;" 
            const sqlDeleteCCP  = "DELETE FROM CCP WHERE TRACKCNPJ= ?;"
            const sqlUpdateCCP = "UPDATE CCP SET CCP_NUMBER= ? WHERE TRACKCNPJ= ? ;"
            const sqlDeleteComment= "DELETE FROM COMMENTS WHERE ID= ?;"
            const sqlCNPJParams = [
                util.sanitizeCNPJ(cnpj),
                util.normalizeName(name),
                util.normalizeName(municipio),
                comments ? cnpjId : null,
                cnpjId
            ] 
            this.db.exec("BEGIN TRANSACTION;")
            if(comments){
                const commentExists = await this.findOne(sqlFindComment, [cnpjId])
                if(commentExists) await this.execQuery(sqlUpdateComments, [comments, cnpjId], "Falha ao atualizar comentários!")
                else await this.execQuery(sqlInsertComments, [cnpjId, comments], "Falha ao inserir comentários!")
            } else this.execQuery(sqlDeleteComment, [cnpjId], "Falha ao deletar comentários!")
        
            if(ccp) {
                const ccpExists = await this.findOne(sqlFindCCP, [cnpjId])
                if(ccpExists) await this.execQuery(sqlUpdateCCP, [ccp, cnpjId], "Falha ao atualizar CCP!")
                else this.execQuery(sqlInsertCCP, [ccp, cnpjId], "Falha ao inserir CCP!")
            } else await this.execQuery(sqlDeleteCCP, [cnpjId], "Falha ao deletar CCP!")
            
            await this.execQuery(sqlCNPJ, sqlCNPJParams, "Falha ao atualizar CNPJ!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })
}

DAO.prototype.setLicensesSent = function (id, status) {
    return new Promise (async (res, rej) => {
        try {
            const sqlSetLicensesSent = "UPDATE CNPJ SET LICENSES_SENT= ? WHERE ID= ?;"
           
            this.db.exec("BEGIN TRANSACTION;")
            await this.execQuery(sqlSetLicensesSent, [status, id], "Falha ao atualizar alvarás enviados!")
            this.db.exec("END TRANSACTION;")
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
            const sqlCNPJ = "INSERT INTO CNPJ VALUES (NULL, ?, ?, datetime(CURRENT_TIMESTAMP, 'localtime'), ?, 1, NULL, 0);"
            const sqlUpdateCNPJ = "UPDATE CNPJ SET COMMENT_ID= ? WHERE ID= ?"
            const sqlComments = "INSERT INTO COMMENTS VALUES(?, ?);"
            const sqlInsertCCP = "INSERT INTO CCP VALUES (NULL, ?, ?);"
            const sqlCNPJParams = [
                util.sanitizeCNPJ(cnpj),
                util.normalizeName(name),
                util.normalizeName(municipio),
            ]
            this.db.exec("BEGIN TRANSACTION;")
            const id = await this.insertReturningId(sqlCNPJ, sqlCNPJParams, "Falha ao inserir CNPJ!")
            if(comments) {
                await this.execQuery(sqlUpdateCNPJ, [id, id], "Falha ao atualizar CNPJ!")
                await this.execQuery(sqlComments, [id, comments], "Falha ao inserir comentário!")
            }
            if(ccp) await this.execQuery(sqlInsertCCP, [ccp, id])
            this.db.exec("END TRANSACTION;")
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
            const placeholders = data.map(() => "?").join(",");
            const sqlCNPJ = `DELETE FROM CNPJ WHERE ID IN (${placeholders});`
            const sqlCCP = `DELETE FROM CCP WHERE TRACKCNPJ IN (${placeholders});`
            const sqlComments = `DELETE FROM COMMENTS WHERE ID IN (${placeholders});`

            this.db.exec("BEGIN TRANSACTION;")
            await this.execQuery(sqlCNPJ, cnpjList, "Falha ao deletar CNPJ!")
            await this.execQuery(sqlCCP, cnpjList, "Falha ao deletar CCP!")
            await this.execQuery(sqlComments, cnpjList, "Falha ao deletar comentários!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })
}

DAO.prototype.insertSentYearTPI = function (data) {
    const { id, year } = data
    const sql = "INSERT INTO YEARS_TPI VALUES(NULL, ?, ?);"
    return this.execQuery(sql, [year, id], "Falha ao inserir o ano na tabela!")
}

DAO.prototype.deleteSentYearTPI = function (data) {
    const { id, year } = data
    const sql = `DELETE FROM YEARS_TPI WHERE YEAR= ? AND TRACKCNPJ= ?;`
    return this.execQuery(sql, [year, id], "Falha ao deletar o ano da tabela!")
}

DAO.prototype.insertSentDuam = async function (data) {
    const { id, duam } = data
    const findId = "SELECT * FROM DUAM_CCP WHERE CNPJ_ID=?;"
    const sqlInsertDuam = "INSERT INTO DUAM_CCP VALUES(NULL, ?, ?);"
    const sqlUpdateDuam = "UPDATE DUAM_CCP SET DUAM=? WHERE CNPJ_ID=?;"
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
    const findId = "SELECT * FROM DUAM_CCP WHERE CNPJ_ID=?;"
    const objExists = await this.findOne(findId, [id], "Falha ao buscar DUAM!");
    const sqlDeleteDuam = "DELETE FROM DUAM_CCP WHERE CNPJ_ID=?;"
    const sqlUpdateDuam = "UPDATE DUAM_CCP SET DUAM=? WHERE CNPJ_ID=?;"
    if(!objExists) return
    const duamsArray = objExists.DUAM?.split(";")
    const duamExists = duamsArray.includes(duam.toString())
    if(!duamExists) return
    const newDuamsArray = duamsArray.filter(currentDuam => currentDuam !== duam.toString())
    if(newDuamsArray.length === 0) return this.execQuery(sqlDeleteDuam, [id], "Falha ao deletar DUAM na tabela!")
    return this.execQuery(sqlUpdateDuam, [newDuamsArray.join(";"), id], "Falha ao deletar DUAM na tabela!")
}

DAO.prototype.authenticate = async function (user, pass) {
    const sql = `SELECT * FROM USERS WHERE NAME= ? AND PASS= ?;`
    return this.findOne(sql, [user, pass], "Usuário não encontrado!")
}

DAO.prototype.toggleStatus = function (objArray) {
    return new Promise(async (res, rej) => {
        const enabled = []
        const disabled = []
        for(item of objArray) {
            item.newStatus === 1 ? enabled.push(item.id) : disabled.push(item.id)
        }
        const sqlEnabled = `UPDATE CNPJ SET STATUS=1 WHERE ID IN (?);`
        const sqlDisabled = `UPDATE CNPJ SET STATUS=0 WHERE ID IN (?);`

        try {
            this.db.exec("BEGIN TRANSACTION;")
            if(enabled) await this.execQuery(sqlEnabled, [enabled.join(",")], "Falha ao alterar status de itens ativos!")
            if(disabled) await this.execQuery(sqlDisabled, [disabled.join(",")], "Falha ao alterar status de itens inativos!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (err) {
            rej(err.message)
        }
    })
}
DAO.prototype.execQuery = function(sql, params, message) {
    return new Promise((res, rej) => {
        this.db.run(sql, params, (error) => {
            if(error) {
                this.db.exec("ROLLBACK;")
                return rej(message ? message : error)
            }
            res()
        }) 
    })
}

DAO.prototype.execQueryWithResults = function(sql, params, message) {
    return new Promise((res, rej) => {
        this.db.all(sql, params, (error, results) => {
            if(error) { rej(message ? message : error); return }
            res(results)
        }) 
    })
}

DAO.prototype.findOne = function(sql, params, message) {
    return new Promise((res, rej) => {
        this.db.get(sql, params, (error, row) => {
            if(error) { rej(message ? message : error); return }
            if(row === undefined) { res(false); return }
            res(row)
        }) 
    })
}

DAO.prototype.insertReturningId = function(sql, params, message) {
    return new Promise((res, rej) => {
        this.db.run(sql, params, function (error) {
            if(error) rej(message ? message : error)
            res(this.lastID)
        })
    })
}

module.exports = function () {
    return DAO
}