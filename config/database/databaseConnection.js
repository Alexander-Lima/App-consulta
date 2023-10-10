const sqlite = require('sqlite3').verbose();

module.exports = function () {
    this.db = function () {
        const dbPath = "\\\\192.168.1.202\\dados novo servidor\\01 Geral\\28 App Consulta DB\\Main.db"
        return new sqlite.Database(dbPath)
    }
    return this
}
