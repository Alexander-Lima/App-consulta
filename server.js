import app from './app.js'

app.listen(process.env.APP_PORT, process.env.APP_IP, () => {
    console.log(`Aplicação de Consultas Prefeitura e Sicabom está rodando em ${process.env.APP_IP}:${process.env.APP_PORT}`)
});

  