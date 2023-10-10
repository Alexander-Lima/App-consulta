var Service = require('node-windows').Service;

var svc = new Service({
     name:'App-consulta',
     description: 'Runs App-consulta permanently.',
     script: 'E:\\Aplicativos\\App-consulta\\app.js'
});

svc.on('install', () => { svc.start() });

svc.install();