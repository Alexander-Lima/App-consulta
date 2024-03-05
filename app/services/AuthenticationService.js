const bcrypt = require('bcrypt');

module.exports = function() {
    this.authenticate = async (DAO, user, pass) => {
        return new Promise(async (res, rej) => {
            const { hash }  = await DAO.getUserPasswordHash(user)
            bcrypt.compare(pass, hash, (err, result) => {
                if(err) {
                    rej(err)
                }
                res(result)
            })
        })
    }
    return this
}