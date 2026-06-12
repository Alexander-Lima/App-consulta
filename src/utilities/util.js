function sanitizeCNPJ(cnpj) {
    const regex = /^[0-9]{11,14}$/;
    
    return regex.test(cnpj) ? cnpj : false;
}

function normalizeName(name) {
    return name.replaceAll(";", "").substring(0,50).toUpperCase();
}

async function getPromisesArray(itemsArray, functionToProcess, itemsToProcess) {
    let promisesArray = [];

    for(let index = 0; index < itemsToProcess; index++) {
        if(itemsArray.length > 0) {
            const arrayItem = itemsArray.pop();
            promisesArray.push(functionToProcess(arrayItem));
            continue;
        }

        break;
    }

    return Promise.all(promisesArray);
}

function getAxiosRetryDefaultConfig() {
    return { 
        retries: 3,
        retryCondition: () => true
    }
} 

function standardJsonError(res, errorObject) {
    return res.status(400).end(JSON.stringify({error: errorObject?.message ? errorObject.message : "unknown"}));
}

export { sanitizeCNPJ, normalizeName, getPromisesArray, getAxiosRetryDefaultConfig, standardJsonError }

