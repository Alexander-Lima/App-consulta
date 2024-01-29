module.exports = function (app) {
    app.get('/consulta-simples/:clientId', async (req, res) => {
        try {
            const clientId = req.params.clientId;
            if(isNaN(clientId)) {
                return res.status(400).end();
            }
            const Service = app.app.services.ConsultaSimplesNacionalService
            const result = await Service.isOptanteSimples(req.params.clientId);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ isOptante: result }));
        } catch (e) {
            res.status(400).end(e.message ? e.message : e)
        }
    })
}