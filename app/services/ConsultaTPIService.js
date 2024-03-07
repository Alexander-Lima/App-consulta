const axios = require('axios').default
const formData = require('form-data')
const util = require('../utilities/util').util
const error_SEM_REGISTRO = false
const error_FALHA = false

module.exports = function () {
    this.getTPI = (dbItems) => {
        return new Promise (async (res, rej) => {
            let cnpjDataArray = []
            let resultArray = []
            const maxPromises = 10
    
            while(dbItems.length > 0) {
                const promisesResult = await util.getPromisesArray(dbItems, getCnpjData, maxPromises)
                cnpjDataArray.push(...promisesResult)
            }  
            if(!cnpjDataArray) { 
                return rej("Falha ao buscar empresas no Sicabom")
            }
            cnpjDataArray = cnpjDataArray.filter(cnpj => cnpj)
            while(cnpjDataArray.length > 0) {
                const promisesResult = await util.getPromisesArray(cnpjDataArray, getTpidata, maxPromises)
                resultArray.push(...promisesResult)
            }  
            if(!resultArray) { 
                return rej("Falha ao buscar dados no Sicabom")
            }
            res(resultArray)
        })

        async function getCnpjData (item) {
            return new Promise(async (res) => {
                const {
                    id,
                    nome_empresa,
                    municipio,
                    sent,
                    comment_id,
                    comment_text,
                    cnpj,
                    status
                } = item
                if(status === 0) {
                    return res()
                }
                let cnpjData = {
                    id: id,
                    cpf_cnpj: cnpj,
                    nome_empresa: nome_empresa,
                    municipio: municipio,
                    sent: sent,
                    comment_id: comment_id,
                    comment_text: comment_text,
                    sem_registro: true,
                    inconsistent: false,
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
                form.append("cnpj", cnpj)
                if(!error_SEM_REGISTRO) {
                    resp = await axios.post(
                        "https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                        .catch((e) => false)
                }
                if(resp.data) {
                    const { C_ID, SP_ID, ANO_ATUAL, ANO_INICIO_TPI } = resp.data[0]
                    cnpjData.c_id = C_ID,
                    cnpjData.sp_id = SP_ID,
                    cnpjData.ano_atual = ANO_ATUAL,
                    cnpjData.ano_inicio_tpi = ANO_INICIO_TPI
                    cnpjData.sem_registro = false
                }
                res(cnpjData)
            })
        }
        
        async function getTpidata (item) {
            return new Promise(async (res) => {
                const {
                    cpf_cnpj,
                    c_id,
                    ano_atual,
                    ano_inicio_tpi,
                    sp_id,
                    sem_registro
                } = item
                if(sem_registro) {
                    return res(item)
                }    
                const form = new formData()
                form.append("acao", "buscar_tpi")
                form.append("data[CPF_cnpj]", cpf_cnpj)
                form.append("data[C_ID]", c_id)
                form.append("data[ANO_ATUAL]", ano_atual)
                form.append("data[ANO_INICIO_TPI]", ano_inicio_tpi)
                form.append("data[SP_ID]", sp_id)
                let resp = false
                if(!error_FALHA) {
                    resp = await axios.post("https://sicabom.bombeiros.go.gov.br/application/server/dao_tpi.php", form)
                    .catch(err => false)
                }
                if(resp.data) {
                    let debitObjects = []
                    for(debitItem of resp.data) {
                        const { SITUACAO, DATA_VENCIMENTO, ANO_PRESTACAO, REGISTRO_CODIGO_BARRAS, VALOR_TOTAL } = debitItem
                        const debit = {
                            situacao: SITUACAO,
                            data_vencimento: DATA_VENCIMENTO,
                            ano_prestacao: ANO_PRESTACAO,
                            codigo_barras: REGISTRO_CODIGO_BARRAS,
                        }
                        if(VALOR_TOTAL == "-1") item.inconsistent = true
                        debitObjects.push(debit)
                    }
                    item.failed = false
                    item.debits = debitObjects
                }
                res(item)
            })
        }
    }
    return this
}
