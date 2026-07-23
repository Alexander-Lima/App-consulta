import axios from 'axios';
import { sleep, logToFile } from '../../utilities/util.js';

const MAX_RETRIES = 3;
const DELAY_MS = 30000; 
const AXIOS_TIMEOUT = 5000;
const axioClient = axios.create({ validateStatus: () => true, timeout: AXIOS_TIMEOUT });

async function update() {
    const resp = 
        (await axioClient.get("http://192.168.1.203/php/json/empresas/ativa").catch(err => false));
    
    if(resp?.status !== 200) {
        return logToFile("Falha ao buscar dados na api interna.");
    }

    let clients = resp.data?.data;

    if(!isUpdateDay()) {
        clients = clients.map(client => convertCommentToJson(client))
                        .filter(client => !client?.OBS?.lastUpdate);
    }

    await processClients(clients);
}

async function saveData(id, data) {
    const warning = "***NÃO MODIFIQUE ESTA ABA! EM CASO DE DÚVIDAS, FALE COM O ALEX.***\r\n\r\n";
    const [day, month, year] = (new Date(Date.now())).toLocaleDateString()?.split("/");
    data['lastUpdate'] = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();

    const payload = {
        "id": id,
        "comment": `${warning}${JSON.stringify(data)}`
    };

    const res = await axios.put("http://192.168.1.203/php/json/empresas", payload).catch(err => false);

    if(res?.status == 200) {
        return { success: true };
    }
    
    return { error: true };
}

async function getApiData(id, retries = 0) {
    const res =  await axioClient.get(`https://open.cnpja.com/office/${id?.replaceAll(" ", "")}`).catch(err => false);

    if(retries >= MAX_RETRIES) {
        return { error: `Máximo de tentativas excedido para CNPJ${id}` }
    }

    if(res.status !== 200) {
        logToFile(`Erro na api CNPJ Já, tentando novamente para ` + 
        `o CNPJ${id} em ${ DELAY_MS / 1000 }s [${ retries + 1 }].`);
        await sleep(DELAY_MS);
        return await getApiData(id, ++retries);
    }

    return { data: res.data };
}

function convertCommentToJson(client) {
    try {
        const HEADER_LENGTH = 70;
        const commentText = client.OBS.substring(HEADER_LENGTH);
        client.OBS = JSON.parse(commentText);

    } catch(e) {
        client.OBS = null;
    }

    finally {
        return client;
    }
}

async function processClients(clients) {
    if(!clients.length) {
        logToFile("Nenhuma empresa pendente de processamento.");
    }

    for(const client of clients) {
        const { data, error } = await getApiData(client.CNPJ);
        
        logToFile(error || `Busca concluída para o CNPJ${client.CNPJ}.`);

        const { success } = await saveData(client.ID, data || "\"lastUpdate\":\"null\"}");

        logToFile(
            success ? 
            `Dados do CNPJ${client.CNPJ} gravado no banco de dados.` :
            "Falha ao gravar no banco de dados."
        );
    }
}

function isUpdateDay() {
    const currentDate = new Date(Date.now());
    const allowedDays = JSON.parse(process.env.ALLOWED_UPDATE_CNPJJA_DAYS);

    return allowedDays.includes(currentDate.getDate())
}

export { update }