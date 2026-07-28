import axios from 'axios';
import { sleep, logToFile, getToday, replaceLast } from '../../utilities/util.js';
import { Mailer } from '../../classes/mailer.js';

const MAX_RETRIES = 3;
const DELAY_MS = 30000; 
const AXIOS_TIMEOUT = 30000;
const axioClient = axios.create({ validateStatus: () => true, timeout: AXIOS_TIMEOUT });

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
    const warning = "***NÃO MODIFIQUE ESTA ABA! EM CASO DE DÚVIDAS, FALE COM O ALEX.***\r\n\r\n";
    data['batchDate'] = nextBatchDate.toISOString();

    const payload = {
        "id": id,
        "details": `${warning}${JSON.stringify(data)}`
    };

    const res = await axios.put("http://192.168.1.203/php/json/empresas", payload).catch(err => false);

    if(res?.status == 200) {
        return { success: true };
    }
    
    return { error: true };
}

async function getApiData(id, retries = 0) {
    let res = {};

    if(process.env.ENABLE_CNPJJA_API_KEY == "true" && process.env.CNPJJA_API_KEY) {
        const auth = { Authorization: process.env.CNPJJA_API_KEY };

        res =  await axioClient.get(
            `https://api.cnpja.com/office/asda${id?.replaceAll(" ", "")}` + 
            "?simples=true&registrations=ORIGIN&maxAge=2", { headers: auth }).catch(err => false);
    } else {
        res =  await axioClient.get(`https://open.cnpja.com/office/${id?.replaceAll(" ", "")}`).catch(err => false);
    }

    if(retries >= MAX_RETRIES) {
        return { error: `Máximo de tentativas excedido para CNPJ${id}` };
    }

    if(res.status !== 200) {
        if(res.status !== 429) {
            const message = res?.data?.message ? ` [${res.data.message}]` : "";
            logToFile(`Erro na api CNPJ Já, erro desconhecido com código ${ res.status }${ message }.` + 
            ` Tentando novamente para o CNPJ${id} em ${ DELAY_MS / 1000 }s [${ retries + 1 }].`);

        } else if(res?.data?.message == "rate limit exceeded") {
            logToFile(`Erro na api CNPJ Já, número de tentativas por minuto excedido. ` + 
            `Tentando novamente para o CNPJ${id} em ${ DELAY_MS / 1000 }s [${ retries + 1 }].`);

        } else if(res?.data?.message == "not enough credits") {
            return { error: `Erro na api CNPJ Já, créditos insuficientes para a pesquisa do CNPJ${id}.` };
        } 

        // await sleep(DELAY_MS);
        return await getApiData(id, ++retries);
    }

    return { data: res.data };
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
        
        logToFile(error || `Busca concluída para o CNPJ${client.CNPJ}.`);

        if(data) {
            const { success } = await saveData(client.ID, data || "\"batchDate\":\"null\"}", nextBatchDate);
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
    const resp = await axioClient.get("http://192.168.1.203/php/json/empresas/ativa").catch(err => false);

    if(resp?.status !== 200) {
        logToFile("Falha ao buscar dados na api interna.");
        return null;
    }

    return resp.data?.data;
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
            `<strong>${id} | ${name}</strong>:` + 
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
            `${ie.number} (${ie.state}) não está habilitada;`))
    }

    return companyReport;
}

function getParsedDaysEnv() {
    try {
        const allowedDays = JSON.parse(process.env.ALLOWED_REPORT_DAYS);

        return allowedDays;

    } catch (error) {
       return null; 
    }
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