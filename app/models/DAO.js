const util = require('../utilities/util').util
class DAO {
    constructor (db) {
        this.db = db
    }
}

DAO.prototype.getAllJoinCCP = function () {
    return new Promise((res, rej) => {
        let sql = "SELECT cnpj.id, cnpj.cnpj, cnpj.nome_empresa, ccp.ccp_number, cnpj.municipio"
                + " FROM CNPJ LEFT OUTER JOIN CCP ON cnpj.id=ccp.trackcnpj ORDER BY cnpj.nome_empresa;"
                
        this.db.all(sql, (err, result) => {
            if(err) console.log(err.message)
            if(err) {rej(err.message); return}
            res(result)
        })
    })
}

DAO.prototype.getAllCNPJ = function () {
    return new Promise((res, rej) => {
        let sql = "SELECT cnpj.id, cnpj.cnpj, cnpj.nome_empresa, cnpj.municipio, years.sent FROM cnpj LEFT OUTER JOIN " 
                + "(SELECT trackcnpj, GROUP_CONCAT(year, ';') AS sent FROM years GROUP BY (trackcnpj)) AS years " 
                + "ON cnpj.id = years.trackcnpj ORDER BY cnpj.nome_empresa;"

        this.db.all(sql, (err, result) => {
            if(err) {rej(err); return}
            res(result)
        })
    })
}

DAO.prototype.getSentYears = function (id) {
    return new Promise((res, rej) => {
        let sql = `SELECT GROUP_CONCAT(year, ';') AS sent FROM YEARS WHERE TRACKCNPJ=${id};`

        this.db.all(sql, (err, result) => {
            if(err) {rej(err); return}
            [{sent}] = result

            res(sent ? {SENT : sent.split(";")} : [])
        })
    })
}

DAO.prototype.updateItem = function (data) {
    return new Promise (async (res, rej) => {
        try {
            this.db.exec("BEGIN TRANSACTION;")
            await updateTableCNPJ(this.db, data)
            await updateTableCCP(this.db, data)
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })

    async function updateTableCNPJ (db, data) {
        return new Promise((res, rej) => {
            let sanitizedCNPJ = util.sanitizeCNPJ(data.cnpj)
            
            if(!sanitizedCNPJ) rej("CNPJ inválido!")
            
            let sql = `UPDATE CNPJ SET CNPJ="${sanitizedCNPJ}", ` 
                    + `NOME_EMPRESA="${util.normalizeName(data.name)}", `
                    + `MUNICIPIO="${util.normalizeName(data.municipio)}" WHERE ID=${data.id};`
        
            db.exec(sql, (error) => {
                if(error) {rej("Falha ao atualizar CNPJ!"); return}
                res()
            }) 
        })
    }
    async function updateTableCCP (db, data) {
        return new Promise((res, rej) => {
            let ccp = data.ccp ? `"${data.ccp}"` : "NULL"
            let sql = `UPDATE CCP SET CCP_NUMBER=${ccp} WHERE TRACKCNPJ=${data.id};`;

            db.exec(sql, (error) => {
                if(error) {db.exec("ROLLBACK;"); rej("Falha ao atualizar CCP!"); return}
                res()
            }) 
        })
    }
}

DAO.prototype.insertItem = function (data) {
    return new Promise(async (res, rej) => {
        try {
            const sanitizedCNPJ = util.sanitizeCNPJ(data.cnpj)
            const normalizedName = util.normalizeName(data.name)
            const normalizedMunicipio = util.normalizeName(data.municipio)
            const {ccp} = data

            this.db.exec("BEGIN TRANSACTION;")
            await insertTableCNPJ(this.db, sanitizedCNPJ, normalizedName, normalizedMunicipio)
            await insertTableCCP(this.db, sanitizedCNPJ,ccp)
            this.db.exec("END TRANSACTION;")
            res()

        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })

    async function insertTableCNPJ (db, sanitizedCNPJ, normalizedName, normalizedMunicipio) {
        return new Promise (async (res, rej) => {
            if(!sanitizedCNPJ) {rej("CNPJ inválido!"); return}
            
            let sqlInsertCNPJ = `INSERT INTO CNPJ VALUES (NULL, "${sanitizedCNPJ}",
                                 "${normalizedName}", NULL, "${normalizedMunicipio}");`
    
            db.exec(sqlInsertCNPJ, (error) => {
                if(error)  {rej("Falha ao inserir dados de CNPJ!"); return}
                res()
            })
        })
    }
    
    async function insertTableCCP (db, sanitizedCNPJ, ccp) {
        return new Promise(async (res, rej) => {
            let sqlGetId = `SELECT ID FROM CNPJ WHERE CNPJ="${sanitizedCNPJ}";`

            db.all(sqlGetId, (error, results) => {
                if(error) {db.exec("ROLLBACK;"); rej("ID da empresa não encontrado!"); return}
    
                let id = results ? results[0]?.id : ""
                let sqlInsertCCP = `INSERT INTO CCP VALUES (NULL, ${ccp ? ccp : "NULL"}, ${id});`
        
                db.exec(sqlInsertCCP, (error) => {
                    if(error) {db.exec("ROLLBACK;"); rej("Falha ao inserir dados de CCP!"); return}
                    res()
                }) 
            })
        })
    }
}

DAO.prototype.deleteItems = function (data) {
    return new Promise(async (res, rej) => {
        try {
            this.db.exec("BEGIN TRANSACTION;")
            await deleteTableCNPJ(this.db, data)
            await deleteTableCCP(this.db, data)
            this.db.exec("END TRANSACTION;")
            res()
        } catch (e) {
            rej(e.message ? e.message : e)
        }
    })

    async function deleteTableCNPJ (db, data) {
        return new Promise((res, rej) => {
            let sqlDeleteFromCNPJ = `DELETE FROM CNPJ WHERE ID IN (${data.ids});`
        
            db.exec(sqlDeleteFromCNPJ, (error) => {
                if(error) {rej("Falha ao deletar CNPJ!"); return}
                res()
            })
        })
    }
    
    async function deleteTableCCP (db, data) {
        return new Promise((res, rej) => {
            let sqlDeleteFromCCP = `DELETE FROM CCP WHERE TRACKCNPJ IN (${data.ids});`
    
            db.exec(sqlDeleteFromCCP, (error) => {
                if(error) {db.exec("ROLLBACK;"); rej("Falha ao deletar CCP!"); return}
                res()
            })
        })
    }
}

DAO.prototype.getCountEmpresas = function (origin) {
    return new Promise ((res, rej) => {
        let sql = origin === "/consulta-tpi" ? 
            "SELECT COUNT(ID) FROM CNPJ;" : 
            "SELECT COUNT(ID) FROM CCP WHERE CCP_NUMBER > 0"
        
        this.db.all(sql, (err, result) => {
            if(err) {rej(err.message); return}
            const [count] = result
            res(count)
        }) 
    })
}

DAO.prototype.insertSentYear = function (data) {
    return new Promise((res, rej) => {
        let sql = `INSERT INTO years values(NULL, ${data.year}, ${data.id}); `

        this.db.exec(sql, (err) => {
            if(err) {rej(err.message); return}
            res()
        }) 
    })
}

DAO.prototype.deleteSentYear = function (data) {
    return new Promise((res, rej) => {
        let sql = `DELETE FROM years WHERE YEAR=${data.year} AND TRACKCNPJ=${data.id};`

        this.db.exec(sql, (err) => {
            if(err) {rej(err.message); return}
            res()
        }) 
    })
}
DAO.prototype.getUserID = function (user, pass) {
    return new Promise((res, rej) => {
        let sql = `SELECT * FROM USERS WHERE NAME="${user}" AND PASS="${pass}";`

        this.db.all(sql, (err, result) => {
            if(err) {rej(err.message); return}
            res(result)
        })
    })
}

module.exports = function () {
    return DAO
}