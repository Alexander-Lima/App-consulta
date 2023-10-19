const sqlite = require('sqlite3').verbose();
const PRODUCTION = true;

module.exports = function () {
    this.db = function () {
        const dbPath = 
            PRODUCTION ? "\\\\192.168.1.202\\dados novo servidor\\01 Geral\\28 App Consulta DB\\Main.db":
                         "C:\\Users\\Controller\\Desktop\\Consulta\\App-consulta\\Main.db"
        return new sqlite.Database(dbPath)
    }
    return this
}
