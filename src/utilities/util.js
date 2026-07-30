import fs from 'fs';
import path from 'path';

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

function sleep(delayMS) {
    return new Promise(res => setTimeout(() => res(), delayMS));
}

function logToFile(message) {
    const time = new Date(Date.now());
    fs.appendFile(
        process.env.LOG_PATH, `${time.toLocaleDateString()} - ${time.toLocaleTimeString()} -> ${message}\n`, 
        (err) => {}
    );
}

function getToday() {
    const date = new Date(Date.now());
    date.setHours(12, 0, 0, 0);

    return date;
}

function getParsedDaysEnv() {
    try {
        return JSON.parse(process.env.ALLOWED_REPORT_DAYS);

    } catch (error) {
       return null; 
    }
}

function replaceLast(string, search, replacement) {
  const index = string.lastIndexOf(search);

  if (index === -1) return string;
  return `${string.slice(0, index)}${replacement}${string.slice(index + search.length)}`;
}

export { 
    sanitizeCNPJ,
    normalizeName,
    getPromisesArray,
    getAxiosRetryDefaultConfig,
    standardJsonError,
    sleep,
    logToFile,
    getToday,
    replaceLast,
    getParsedDaysEnv
}

