import axios from 'axios';
import { sleep, logToFile, getToday, replaceLast, getParsedDaysEnv } from '../../utilities/util.js';
import { Mailer } from '../../classes/mailer.js';

const MAX_RETRIES = 3;
const DELAY_MS = 30000; 
const AXIOS_TIMEOUT = 30000;
const axioClient = axios.create({ timeout: AXIOS_TIMEOUT });
const isOfficialApi = 
    process.env.ENABLE_CNPJJA_API_KEY == "true" && process.env.CNPJJA_API_KEY;

async function update() {
    const nextBatchDate = getNextBatchDate();

    if(!nextBatchDate) {
        return logToFile("Não foi possível determinar o dia do proximo lote.");
    }

    const clients = await getAllActiveClients();
    
    if(!clients) {
        return logToFile("Nenhum cliente retornado pela api.");
    }
    
    await processClients(clients, nextBatchDate);

    if(isReportDay()) {
        generateReport(clients);
    }

    logToFile("Rotina concluída.");
}

async function saveData(id, data, nextBatchDate) {
    data['batchDate'] = nextBatchDate.toISOString();

    const payload = {
        "id": id,
        "details": JSON.stringify(data)
    };

    const res = await axios.put("http://192.168.1.203/php/json/empresas", payload).catch(err => err);
    
    return res?.status == 200;
}

async function getApiData(id, retries = 0) {
    const res = await callApi(id);

    if(retries >= MAX_RETRIES) {
        return { error: `Máximo de tentativas excedido para CNPJ${id}` };
    }

    if(!axios.isAxiosError(res)) {
        return { data: res.data };
    }

    if(res?.response?.status !== 200) {
        return await logErrorsAndRetry(res, id, retries);
    }
}

function callApi(id) {
    if(isOfficialApi) {
        const auth = { Authorization: process.env.CNPJJA_API_KEY };

        return axioClient.get(
            `https://api.cnpja.com/office/${id?.replaceAll(" ", "")}` + 
            "?simples=true&registrations=ORIGIN&maxAge=3", { headers: auth }).catch(err => err);
    } else {
        return axioClient.get(`https://open.cnpja.com/office/${id?.replaceAll(" ", "")}`).catch(err => err);
    }
}

async function logErrorsAndRetry(res, id, retries) {
    if(!res.response) {
        logToFile(`Erro na chamada da api CNPJ Já. Mensagem: ${ res.message }. ` + 
        `Tentando novamente para o CNPJ${id} em ${ DELAY_MS / 1000 }s [${ retries + 1 }].`);
    
    } else if(res.response.data?.message == "not enough credits") {
        return { error: `Erro na api CNPJ Já, créditos insuficientes para a pesquisa do CNPJ${id}.` };

    } else {
        logToFile(`Erro na resposta da api CNPJ Já. ` + 
        `Status: [${res.response?.status || -1 }] ${res.response.data?.message || "vazio" }. ` +
        `Tentando novamente para o CNPJ${id} em ${ DELAY_MS / 1000 }s [${ retries + 1 }].`);
    } 

    await sleep(DELAY_MS);

    return await getApiData(id, ++retries);
}

async function processClients(clients, nextBatchDate) {
    if(!clients?.length) {
        return logToFile("Nenhuma empresa pendente de processamento.");
    }
    
    for(const client of clients) {
        const savedBatchDate = new Date(client?.DETAILS?.batchDate || null);
        // const isExpired = savedBatchDate.getTime() != nextBatchDate.getTime();
        const isExpired = true;
        
        if(!isExpired) {
            continue;
        }

        const { data, error } = await getApiData(client.CNPJ);
        
        logToFile(error || `Busca concluída para o CNPJ${client.CNPJ}` + 
            ` na API ${ isOfficialApi ? "oficial" : "gratuita"}.` );

        if(data) {
            const success = await saveData(client.ID, data, nextBatchDate);

            logToFile(
                success ? 
                `Dados do CNPJ${client.CNPJ} gravado no banco de dados.` :
                "Falha ao gravar no banco de dados."
            );

            if(!client.DETAILS) {
                client['DETAILS'] = data;
            }
        }
    }
}

function isReportDay() {
    const currentDate = getToday();
    const allowedDays = getParsedDaysEnv();

    return allowedDays ? allowedDays.includes(currentDate.getDate()) : null;
}

async function getAllActiveClients() {
    const res = await axioClient.get("http://192.168.1.203/php/json/empresas/ativa").catch(err => err);

    return res?.status == 200 ? res.data?.data : null;
}

async function generateReport(clients) {
    const errorsFound = [];

    clients.forEach(client => {
        const companyReport = getErrors(client);
    
        if(companyReport?.errors?.length) {
            errorsFound.push(companyReport);
        }
    });

    if(!errorsFound.length) {
        return;
    }

    const HEADER = "<p>Seguem abaixo as pendências encontradas na última verificação:</p>\n"
    const fomattedErrors = 
        errorsFound.map(({ id, name, errors }) => 
            `➤<strong>${id} | ${name}</strong>:` + 
            `<ul>${ errors.map(e => `<li>${e}</li>`).join("") }</ul>`)?.join("");

    (new Mailer(
        "Relatório de pendências",
        `${HEADER}${replaceLast(fomattedErrors, ";", ".")}`)).sendEmail();

}

function getErrors(client) {
    let {
        CNPJ,
        "RAZÃO SOCIAL" : NOME,
        REGIME,
        DETAILS,
        "STATUS DOMÍNIO": STATUS_DOMINIO 
    } = client;
        
    const companyReport = {
        "id": CNPJ,
        "name": NOME,
        "errors": []
    }

    if(!DETAILS) {
        companyReport.errors.push("A busca dos dados da empresa não foi concluída " + 
        "na API CNPJ JÁ, verifique os logs do sistema;");
        return companyReport;
    }

    if(["LUCRO PRESUMIDO", "LUCRO REAL", "IMUNE IRPJ"].includes(REGIME)) {
        REGIME = "REGIME NORMAL";
    }

    let currentRegime = DETAILS?.company?.simples?.optant ? "SIMPLES NACIONAL" : "REGIME NORMAL";
    const status = DETAILS?.status?.text.toUpperCase();

    if(DETAILS?.company?.simei?.optant) {
        currentRegime = "MEI";
    }

    if(REGIME != currentRegime) {
        companyReport.errors.push(`Divergência de regime tributário entre a domínio [${REGIME}] `+ 
        `e Receita Federal [${currentRegime}];`);
    }

    if(status != "ATIVA") {
        const isParalyzed = 
            STATUS_DOMINIO == "ATIVA-SEM MOV." &&
            status == "SUSPENSA" &&
            DETAILS?.reason?.text == "Interrupção temporária das atividades";
            
        if(!isParalyzed) {
            companyReport.errors.push(`A empresa não está ativa na Receita Federal ` + 
            `[status atual: ${status} - Motivo: ${DETAILS?.reason?.text}];`);
        }
    }

    if(DETAILS?.registrations) {
        [...DETAILS.registrations]
            .filter(ie => !ie.enabled)
            .forEach(ie => companyReport.errors.push(`A inscrição estadual ` + 
            `${ie.number} (${ie.state}) não está habilitada - Situação do CNPJ: ${ie.status.text};`))
    }

    return companyReport;
}

function getNextBatchDate() {
    const today = getToday();
    
    const allowedDays = getParsedDaysEnv()?.map(day => {
        const date = new Date(today);
        date.setDate(day);

        if(date.getTime() < today.getTime()) {
            const month = date.getMonth();

            if(month + 1 > 11) {
                date.setMonth(0);
                date.setFullYear(date.getFullYear() + 1);
            } else {
                date.setMonth(month + 1);
            }
        }

        return date;
    });

    if(!allowedDays) {
        return null;
    }

    allowedDays.sort((a, b) => a.getTime() - b.getTime());

    for(const day of allowedDays) {
        if(day >= today) {
            return day;
        }
    }

    return null;
}

export { update }