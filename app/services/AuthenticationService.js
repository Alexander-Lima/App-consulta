const bcrypt = require('bcrypt');

module.exports = function() {
    this.authenticate = (DAO, user, pass) => {
        return new Promise(async (res, rej) => {
            try {
                const { HASH }  = await DAO.getUserPasswordHash(user)
                bcrypt.compare(pass, HASH, (err, result) => {
                    if(err) {
                        throw new Error(err)
                    }
                    res(result)
                })
            } catch (e) {
                return rej(e)
            }
        })
    }
    return this
}