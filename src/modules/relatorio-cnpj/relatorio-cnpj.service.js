import axios from 'axios';
import { sleep, logToFile, getToday, replaceLast, getParsedDaysEnv, COLORS } from '../../utilities/util.js';
import { Mailer } from '../../classes/mailer.js';
import { load } from 'cheerio';

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
    
    const { end } = await processClients(clients, nextBatchDate) || {};

    if(end) {
        return logToFile("Rotina abortada.");  
    }

    if(isReportDay()) {
        await generateReport(clients);
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
    let res = await callApi(id);

    if(retries >= MAX_RETRIES) {
        return { error: `Máximo de tentativas excedido para CNPJ${id}` };
    }

    // res = {
    //     isAxiosError: true,
    //     message: "Request failed with status code 404",
    //     name: "AxiosError",
    //     code: "ERR_BAD_REQUEST",
    //     config: {
    //         url: "/api/users",
    //         method: "get",
    //         headers: {}
    //     },
    //     status: 404,
    //     response: {
    //         data: {
    //             message: "not enough credits"
    //         }
    //     }
    // }

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
            "?simples=true&registrations=ORIGIN&maxAge=10", { headers: auth }).catch(err => err);
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
        const isExpired = savedBatchDate.getTime() != nextBatchDate.getTime();
        // const isExpired = true;
        
        if(!isExpired) {
            continue;
        }

        const { data, error } = await getApiData(client.CNPJ);
        
        logToFile(error || `Busca concluída para o CNPJ${client.CNPJ}` + 
            ` na API ${ isOfficialApi ? "oficial" : "gratuita"}.` );

        if(error?.includes("créditos insuficientes")) {
            return { end: true };
        }

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

    for(const client of clients) {
        const companyReport = await getErrors(client);
    
        if(companyReport?.errors?.length) {
            errorsFound.push(companyReport);
        }
    }

    if(!errorsFound.length) {
        return logToFile("Verificação concluída, nenhuma pendência encontrada.");
    }

    const HEADER = "<p>Seguem abaixo as pendências encontradas na última verificação:</p>\n"
    const fomattedErrors = 
        errorsFound.map(({ id, name, errors }) => 
            replaceLast((`<strong>${id} | ${name}</strong>` + 
            `${ errors.map(e => `<p style="text-indent:35pt">${e}</p>`).join("") }`), ";", ".")
        )?.join("");

    (new Mailer(
        "Relatório de pendências",
        `${ HEADER }${ fomattedErrors }`)).sendEmail();

}

async function getErrors(client) {
    const companyReport = {
        "id": client.CNPJ,
        "name": client["RAZÃO SOCIAL"],
        "errors": []
    }

    if(client.DETAILS) {
        await doValidations(client, companyReport);
        
    } else {
        companyReport.errors.push("A busca dos dados da empresa não foi concluída " + 
            "na API CNPJ JÁ, verifique os logs do sistema;");
    }
    
    return companyReport;
}

async function doValidations(client, companyReport) {
    normalizeFields(client);
    validateStatus(client, companyReport);
    validateRegime(client, companyReport);
    await validateRegistrations(client, companyReport);
}

async function validateRegistrations(client, companyReport) {
    if(client.DETAILS?.registrations) {
        const registrations = [...client.DETAILS.registrations].filter(ie => !ie.enabled);

        for(const { number, state } of registrations) {
            const {
                sintegraGoStatus,
                invoiceEnabled 
            } = state == "GO" ? await getSintegraGoStatus(number) : {};
            let comment = "";
            let dot = "";

            if(["PARALISADA", "BAIXADA"]?.includes(sintegraGoStatus)) {
                continue;

            } else if(!sintegraGoStatus) {
                dot = getFormattedDot(COLORS.RED)
                comment = "[Regularize a situação na SEFAZ do respectivo estado]";

            } else if(sintegraGoStatus && sintegraGoStatus != "ATIVA") {
                dot = getFormattedDot(COLORS.RED)
                comment = `[O status atual é: ${ sintegraGoStatus }, verifique com urgência]`;

            } else if(sintegraGoStatus && !invoiceEnabled) {
                dot = getFormattedDot(COLORS.YELLOW);
                comment = "[Realize o credenciamento na SEFAZ]";
            }

            companyReport.errors.push(`${ dot }A inscrição estadual ${number} (${state})` + 
                ` não está habilitada. ${ comment ? `<strong>${comment}</strong>` : "" };`);
        }
    }
}

function getFormattedDot(color) {
    return `<span style="color: ${ color }; font-size:20px; text-indent: 15pt;">●  </span>`;
}

function validateStatus(client, companyReport) {
    if(client.DETAILS?.status?.text != "ATIVA") {
        const isParalyzed = 
            client["STATUS DOMÍNIO"] == "ATIVA-SEM MOV." &&
            client.DETAILS?.status?.text  == "SUSPENSA" &&
            client.DETAILS?.reason?.text == "Interrupção temporária das atividades";
            
        if(!isParalyzed) {
            const dot = getFormattedDot(COLORS.RED);
            companyReport.errors.push(`${ dot }A empresa não está ativa na Receita Federal ` + 
            `<strong>[status atual: ${client.DETAILS?.status?.text } - Motivo: ${client.DETAILS?.reason?.text}]</strong>;`);
        }
    }
}

function validateRegime(client, companyReport) {
    if(client.REGIME != client.DETAILS.regime) {
        const dot = getFormattedDot(COLORS.RED);
        companyReport.errors.push(`${ dot }Divergência de regime tributário entre a domínio (${client.REGIME}) `+ 
        `e Receita Federal (${client.DETAILS.regime }). <strong>[Verifique a situação com urgência]</strong>;`);
    }
}

function normalizeFields(client) {
    if(["LUCRO PRESUMIDO", "LUCRO REAL", "IMUNE IRPJ"].includes(client.REGIME)) {
        client.REGIME = "REGIME NORMAL";
    }

    client.DETAILS["regime"] = 
        client?.DETAILS?.company?.simples?.optant ? "SIMPLES NACIONAL" : "REGIME NORMAL";

    client.DETAILS.status.text = client.DETAILS?.status?.text.toUpperCase();

    if(client?.DETAILS?.company?.simei?.optant) {
        client.DETAILS.regime = "MEI";
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

async function getSintegraGoStatus(id) {
    const params = new URLSearchParams();
    params.append("tDoc", id);

    const url = "https://appasp.sefaz.go.gov.br/Sintegra/Consulta/consultar.asp";

    const config = {
        headers:  { Referer: "https://appasp.sefaz.go.gov.br/Sintegra/Consulta/default.html" }
    };

    const res = await axioClient.post(url, params, config);

    if(!(res.status == 200 && res.data)) {
        return null;
    }

    const $ = load(res.data);
    const status = 
        $(".label_title")
            .filter((index, el) => $(el).text().includes("Cadastral Vigente"))
            .next(".label_text")
            .text()
            .trim()
            .split("-");

    const invoiceOperations = 
        $(".label_title")
            .filter((index, el) => $(el).text().includes("Operações com NF-E"))
            .next(".label_text")
            .text()
            .trim() == "Habilitado";

    return {
        sintegraGoStatus: 
            status[0] ? 
            status[0].toUpperCase().replace(" ", "").slice(0, -1) + "A" :
            null,
        invoiceEnabled: invoiceOperations
    }
}

export { update }