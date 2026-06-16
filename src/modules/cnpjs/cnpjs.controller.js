import { standardJsonError } from '../../utilities/util.js';
import { getAllService, updateService, toggleStatusService, insertService, deleteService } from './cnpjs.service.js';

async function listCNPJ(req, res) {
    try {
        res.render(import.meta.dirname + "/views/cnpjs", { results : await getAllService() });

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function update(req, res) {
    try {
        await updateService(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function toggleStatus(req, res) {
    try {
        await toggleStatusService(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insert(req, res) {
    try {
        await insertService(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function deleteItems (req, res) {
    try {
        await deleteService(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

export { listCNPJ, update, toggleStatus, insert, deleteItems }