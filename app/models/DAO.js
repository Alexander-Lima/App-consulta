const util = require('../utilities/util').util
class DAO {
    constructor (db) {
        this.db = db
    }
}

DAO.prototype.getAllJoinCCP = function () {
    const sql = "SELECT CNPJ.ID, CNPJ.STATUS, CNPJ.CNPJ, CNPJ.NOME_EMPRESA, CNPJ.STATUS, CNPJ.COMMENT_ID, CNPJ.MUNICIPIO,"
            +" CCP.CCP_NUMBER, COMMENTS.COMMENT_TEXT, YEARS_CCP.YEARS FROM CNPJ LEFT OUTER JOIN CCP ON CNPJ.ID=CCP.TRACKCNPJ LEFT JOIN COMMENTS"
            +" ON COMMENTS.ID=CNPJ.COMMENT_ID LEFT JOIN YEARS_CCP ON YEARS_CCP.CNPJ_ID=CNPJ.ID ORDER BY CNPJ.NOME_EMPRESA;"
    return this.execQueryWithResults(sql)
}

DAO.prototype.getAllCNPJ = function () {
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
            const sqlCommentsUpdate = "UPDATE COMMENTS SET COMMENT_TEXT= ? WHERE ID= ?;"
            const sqlCommentsInsert = "INSERT INTO COMMENTS VALUES(?, ?);"
            const sqlCNPJ = "UPDATE CNPJ SET CNPJ= ?, NOME_EMPRESA= ?, MUNICIPIO= ?, COMMENT_ID= ? WHERE ID= ?;" 
            const sqlCCP = "UPDATE CCP SET CCP_NUMBER= ? WHERE TRACKCNPJ= ? ;"
            const sqlCNPJParams = [
                util.sanitizeCNPJ(cnpj),
                util.normalizeName(name),
                util.normalizeName(municipio),
                comments? cnpjId : "NULL",
                cnpjId
            ] 
            this.db.exec("BEGIN TRANSACTION;")
            if(comments){
                const commentExist = await this.findOne(sqlFindComment, [cnpjId])
                if(commentExist) await this.execQuery(sqlCommentsUpdate, [comments, cnpjId], "Falha ao atualizar comentários!")
                else await this.execQuery(sqlCommentsInsert, [cnpjId, comments], "Falha ao inserir comentários!")
            }
            await this.execQuery(sqlCNPJ, sqlCNPJParams, "Falha ao atualizar CNPJ!")
            if(ccp) await this.execQuery(sqlCCP, [ccp, cnpjId], "Falha ao atualizar CCP!")
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
            const sqlCNPJ = "INSERT INTO CNPJ VALUES (NULL, ?, ?, NULL, ?, 1, NULL);"
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
            await this.execQuery(sqlInsertCCP, [ccp, id])
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
            const placeholders = data.map(() => "?").join(",");
            const sqlCNPJ = `DELETE FROM CNPJ WHERE ID IN (${placeholders});`
            const sqlCCP = `DELETE FROM CCP WHERE TRACKCNPJ IN (${placeholders});`
            const sqlComments = `DELETE FROM COMMENTS WHERE ID IN (${placeholders});`

            this.db.exec("BEGIN TRANSACTION;")
            await this.execQuery(sqlCNPJ, data, "Falha ao deletar CNPJ!")
            await this.execQuery(sqlCCP, data, "Falha ao deletar CCP!")
            await this.execQuery(sqlComments, data, "Falha ao deletar comentários!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })
}

DAO.prototype.insertSentYear = function (data) {
    const { id, year } = data
    let sql = "INSERT INTO YEARS_TPI VALUES(NULL, ?, ?);"
    return this.execQuery(sql, [year, id], "Falha ao inserir o ano na tabela!")
}

DAO.prototype.deleteSentYear = function (data) {
    const { id, year } = data
    let sql = `DELETE FROM YEARS_TPI WHERE YEAR= ? AND TRACKCNPJ= ?;`
    return this.execQuery(sql, [year, id], "Falha ao deletar o ano da tabela!")
}

DAO.prototype.getUserID = async function (user, pass) {
    let sql = `SELECT * FROM USERS WHERE NAME= ? AND PASS= ?;`
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
                rej(message ? message : error)
                return
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