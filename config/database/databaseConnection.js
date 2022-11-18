const sqlite = require('sqlite3');


module.exports = function () {
    this.db = function () {
        return new sqlite.Database("./config/database/Sqlite3/Main.db")
    }
    return this
}
