module.exports = function (app) {
    app.get("/", (req, res) => {
        res.status(200)
        res.render("./home")
        res.end()
    })
}