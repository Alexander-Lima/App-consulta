import { standardJsonError } from '../utilities/util.js';
import { getAllJoinCCP, updateItem, toggleStatusCnpj, insertItem, deleteItemsCnpj } from '../respositories/cnpjs-crud.js';


async function listCNPJ(req, res) {
    try {
        const result = await getAllJoinCCP();
        res.render("./cnpjs-crud", { results : result });

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function update(req, res) {
    try {
        await updateItem(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function toggleStatus(req, res) {
    try {
        await toggleStatusCnpj(req.body);
        res.end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function insert(req, res) {
    try {
        await insertItem(req.body);
        res.status(201).end();

    } catch (e) {
        return standardJsonError(res, e);
    }
}

async function deleteItems (req, res) {
    try {
        await deleteItemsCnpj(req.body);
        res.end();
        
    } catch (e) {
        return standardJsonError(res, e);
    }
}

export { listCNPJ, update, toggleStatus, insert, deleteItems }