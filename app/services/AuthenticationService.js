const bcrypt = require('bcrypt');

module.exports = function() {
    this.authenticate = async (DAO, user, pass) => {
        return new Promise(async (res) => {
            const resp  = await DAO.getUserPasswordHash(user)
            if(!resp) {
                return res(false)
            }
            const { hash } = resp
            bcrypt.compare(pass, hash, (err, result) => {
                if(err) {
                    rej(false)
                }
                res(result)
            })
        })
    }
    return this
}