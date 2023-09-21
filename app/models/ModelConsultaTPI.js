const axios = require('axios').default
const formData = require('form-data')
const error_SEM_REGISTRO = false
const error_FALHA = false

module.exports = function () {
    this.getTPI = (results) => {
        return new Promise (async (res, rej) => {
            const items = await getCnpjData(results)

            if(!items) { rej("Falha ao buscar empresas no Sicabom"); return }
            
            const data = await getTpiData(items)

            if(!data) { rej("Falha ao buscar dados no Sicabom"); return }

            res(data)
        })

        async function getCnpjData (rows) {
            let results = []
        
            for (row of rows) {
                const {
                    ID,
                    NOME_EMPRESA,
                    MUNICIPIO,
                    SENT,
                    COMMENT_ID,
                    COMMENT_TEXT,
                    CNPJ,
                    STATUS
                } = row
                if(STATUS === 0) continue
                let cnpjData = {
                    id: ID,
                    cpf_cnpj: CNPJ,
                    nome_empresa: NOME_EMPRESA,
                    municipio: MUNICIPIO,
                    sent: SENT ? SENT.split(";") : [],
                    comment_id: COMMENT_ID,
                    comment_text: COMMENT_TEXT,
                    sem_registro: true,
                    failed: true,
                    c_id: null,
                    sp_id: null,
                    ano_atual: null,
                    ano_inicio_tpi: null,
                    debits: []
                }
                const form = new formData()
                let resp = false
                form.append("acao", "buscar_logradouros")
                form.append("cnpj", `${row.CNPJ}`)
                if(!error_SEM_REGISTRO) {
                    resp = await axios.post(
                        "https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                        .catch(() => false)
                }
                if(resp.data) {
                    const { C_ID, SP_ID, ANO_ATUAL, ANO_INICIO_TPI } = resp.data[0]
                    cnpjData.c_id = C_ID,
                    cnpjData.sp_id = SP_ID,
                    cnpjData.ano_atual = ANO_ATUAL,
                    cnpjData.ano_inicio_tpi = ANO_INICIO_TPI
                    cnpjData.sem_registro = false
                }
                results.push(cnpjData)
            }
            return results;   
        }
        
        async function getTpiData (items) {
            let results = []
            for (item of items) {
                const {
                    cpf_cnpj,
                    c_id,
                    ano_atual,
                    ano_inicio_tpi,
                    sp_id,
                    sem_registro
                } = item
                if(sem_registro) { results.push(item); continue}    
                const form = new formData()
                form.append("acao", "buscar_tpi")
                form.append("data[CPF_CNPJ]", `${cpf_cnpj}`)
                form.append("data[C_ID]", `${c_id}`)
                form.append("data[ANO_ATUAL]", `${ano_atual}`)
                form.append("data[ANO_INICIO_TPI]", `${ano_inicio_tpi}`)
                form.append("data[SP_ID]", `${sp_id}`)
                let resp = false
                if(!error_FALHA) {
                    resp = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                    .catch(err => false)
                }
                if(resp.data) {
                    let debitObjects = []
                    for(debitItem of resp.data) {
                        const { SITUACAO, DATA_VENCIMENTO, ANO_PRESTACAO, REGISTRO_CODIGO_BARRAS } = debitItem
                        const debit = {
                            situacao: SITUACAO,
                            data_vencimento: DATA_VENCIMENTO,
                            ano_prestacao: ANO_PRESTACAO,
                            codigo_barras: REGISTRO_CODIGO_BARRAS
                        }
                        debitObjects.push(debit)
                    }
                    item.failed = false
                    item.debits = debitObjects
                }
                results.push(item)
            }
            return results;
        }
    }
    return this
}
