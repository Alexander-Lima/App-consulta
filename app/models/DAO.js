const util = require('../utilities/util').util
class DAO {
    constructor (db) {
        this.db = db
    }
}

DAO.prototype.getAllJoinCCP = function () {
    const sql = "SELECT CNPJ.ID, CNPJ.STATUS, CNPJ.CNPJ, CNPJ.NOME_EMPRESA, CNPJ.STATUS, CCP.CCP_NUMBER, CNPJ.MUNICIPIO"
            + " FROM CNPJ LEFT OUTER JOIN CCP ON CNPJ.ID=CCP.TRACKCNPJ ORDER BY CNPJ.NOME_EMPRESA;"
    return this.execQueryWithResults(sql)
}

DAO.prototype.getAllCNPJ = function () {
        let sql = "SELECT CNPJ.ID, CNPJ.STATUS, CNPJ.CNPJ, CNPJ.NOME_EMPRESA, CNPJ.MUNICIPIO," 
                + " YEARS.SENT FROM CNPJ LEFT OUTER JOIN (SELECT TRACKCNPJ, GROUP_CONCAT(YEAR, ';') AS SENT FROM YEARS " 
                + "GROUP BY (TRACKCNPJ)) AS YEARS ON CNPJ.ID = YEARS.TRACKCNPJ ORDER BY CNPJ.NOME_EMPRESA;"

        return this.execQueryWithResults(sql);
}

DAO.prototype.getSentYears = function (id) {
    return new Promise((res, rej) => {
        let sql = `SELECT GROUP_CONCAT(YEAR, ';') AS SENT FROM YEARS WHERE TRACKCNPJ=${id};`

        this.db.all(sql, (err, result) => {
            if(err) { rej(err); return }
            [{ SENT }] = result

            res(SENT ? {SENT : SENT.split(";")} : [])
        })
    })
}

DAO.prototype.updateItem = function (data) {
    return new Promise (async (res, rej) => {
        try {
            const { id, cnpj, ccp, name, municipio, comments } = data
            const sqlCNPJ = `UPDATE CNPJ SET CNPJ="${util.sanitizeCNPJ(cnpj)}", ` 
                    + `NOME_EMPRESA="${util.normalizeName(name)}", `
                    + `MUNICIPIO="${util.normalizeName(municipio)}" WHERE ID=${id};`
            const sqlCCP = `UPDATE CCP SET CCP_NUMBER=${ccp ? ccp : "NULL"} WHERE TRACKCNPJ=${id};`;
            const sqlComments = `UPDATE COMMENTS SET COMMENT_TEXT="${comments}" WHERE ID=${id};`;

            this.db.exec("BEGIN TRANSACTION;")
            await this.execQuery(sqlCNPJ, "Falha ao atualizar CNPJ!")
            await this.execQuery(sqlCCP, "Falha ao atualizar CCP!")
            await this.execQuery(sqlComments, "Falha ao atualizar comentários!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message)
        }
    })
}

DAO.prototype.insertItem = function (data) {
    return new Promise(async (res, rej) => {
        try {
            const { cnpj, name, municipio, ccp, comments } = data
            const sqlComments = `INSERT INTO COMMENTS VALUES(NULL, "${comments}");`
            let commentId = null
            this.db.exec("BEGIN TRANSACTION;")
            if(comments) { commentId = await this.insertReturningId(sqlComments, "Falha ao inserir comentário!") }
            console.log(comments)
            console.log(commentId)
            const sanitizeCNPJ = util.sanitizeCNPJ(cnpj)
            const sqlCNPJ = `INSERT INTO CNPJ VALUES (NULL, "${sanitizeCNPJ}",
                                 "${util.normalizeName(name)}", NULL, "${util.normalizeName(municipio)}", 1, ${commentId});`
            const id = await this.insertReturningId(sqlCNPJ, "Falha ao inserir CNPJ!")
            const sqlInsertCCP = `INSERT INTO CCP VALUES (NULL, ${ccp ? ccp : "NULL"}, ${id});`
            await this.execQuery(sqlInsertCCP)
            this.db.exec("END TRANSACTION;")
            res()

        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })
}

DAO.prototype.deleteItems = function (data) {
    return new Promise(async (res, rej) => {
        const idList = data.idArray.join(",")
        try {
            const sqlCNPJ = `DELETE FROM CNPJ WHERE ID IN (${idList});`
            const sqlCCP = `DELETE FROM CCP WHERE TRACKCNPJ IN (${idList});`
            const sqlComments = `DELETE FROM COMMENTS WHERE ID IN (${idList});`

            this.db.exec("BEGIN TRANSACTION;")
            await this.execQuery(sqlCNPJ, "Falha ao deletar CNPJ!")
            await this.execQuery(sqlCCP, "Falha ao deletar CCP!")
            await this.execQuery(sqlComments, "Falha ao deletar comentários!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })
}

DAO.prototype.insertSentYear = function (data) {
    let sql = `INSERT INTO YEARS values(NULL, ${data.year}, ${data.id});`
    return this.execQuery(sql, "Falha ao inserir o ano na tabela!")
}

DAO.prototype.deleteSentYear = function (data) {
    let sql = `DELETE FROM YEARS WHERE YEAR=${data.year} AND TRACKCNPJ=${data.id};`
    return this.execQuery(sql, "Falha ao deletar o ano da tabela!")
}

DAO.prototype.getUserID = async function (user, pass) {
    let sql = `SELECT * FROM USERS WHERE NAME="${user}" AND PASS="${pass}";`
    return this.findOne(sql, "Usuário não encontrado!")
}

DAO.prototype.toggleStatus = function (objArray) {
    return new Promise(async (res, rej) => {
        const enabled = []
        const disabled = []
        for(item of objArray) {
            item.newStatus === 1 ? enabled.push(item.id) : disabled.push(item.id)
        }

        let sqlEnabled = `UPDATE CNPJ SET STATUS=1 WHERE ID IN (${enabled.join(",")});`
        let sqlDisabled = `UPDATE CNPJ SET STATUS=0 WHERE ID IN (${disabled.join(",")});`

        try {
            this.db.exec("BEGIN TRANSACTION;")
            if(enabled) await this.execQuery(sqlEnabled, "Falha ao alterar status de itens ativos!")
            if(disabled) await this.execQuery(sqlDisabled, "Falha ao alterar status de itens inativos!")
            this.db.exec("END TRANSACTION;")
            res()
        } catch (err) {
            rej(err.message)
        }
    })
}
DAO.prototype.execQuery = function(sql, message) {
    return new Promise(async (res, rej) => {
        this.db.exec(sql, (error) => {
            if(error) {
                this.db.exec("ROLLBACK;")
                rej(message ? message : error)
                return
            }
            res()
        }) 
    })
}

DAO.prototype.execQueryWithResults = function(sql) {
    return new Promise((res, rej) => {
        this.db.all(sql, async (error, results) => {
            if(error) { rej(message); return }
            res(results)
        }) 
    })
}

DAO.prototype.findOne = async function(sql, message) {
    return new Promise((res, rej) => {
        this.db.get(sql, (error, row) => {
            if(error || row === undefined) { rej(message); return }
            res(row)
        }) 
    })
}

DAO.prototype.insertReturningId = async function(sql, message) {
    return new Promise(async (res, rej) => {
        this.db.run(sql, function (error) {
            if(error) rej(message ? message : error)
            res(this.lastID)
        })
    })
}

module.exports = function () {
    return DAO
}