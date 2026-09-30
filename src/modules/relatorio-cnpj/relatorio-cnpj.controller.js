import { update } from './relatorio-cnpj.service.js';
import { standardJsonError, logToFile } from '../../utilities/util.js';
import axios from 'axios';

async function updateData(req, res) {
    update();
    res.status(201).end();
}

export { updateData }