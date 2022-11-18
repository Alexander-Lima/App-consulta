var Service = require('node-windows').Service;

var svc = new Service({
     name:'App-consulta',
     description: 'Runs App-consulta permanently.',
     script: 'I:\\Geral\\31 App Consulta\\app.js'
});

svc.on('install', () => { svc.start() });

svc.install();