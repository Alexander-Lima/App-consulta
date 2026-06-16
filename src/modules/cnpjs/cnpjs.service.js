import { getAllJoinCCP, updateItem, toggleStatusCnpj, insertItem, deleteItemsCnpj } from './cnpjs.respository.js'

async function getAllService() {
    return await getAllJoinCCP();
}

async function updateService(data) {
    return await updateItem(data);
}

async function toggleStatusService(data) {
    return await toggleStatusCnpj(data);
}

async function insertService(data) {
    return await insertItem(data);
}

async function deleteService(data) {
    return await deleteItemsCnpj(data);
}

export { getAllService, updateService, toggleStatusService, insertService, deleteService }