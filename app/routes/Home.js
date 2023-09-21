module.exports = function (app) {
    app.get("/", (req, res) => {
        res.render("./home")
        res.status(200).end()
    })
}