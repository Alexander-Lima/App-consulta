import { executeQueryFunction }  from '../../../config/db.js'

async function getCnpjJoinTPI(id) {
    const query = `SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.municipio, cnpj.comment_id,
        comments.comment_text, years.sent from (SELECT * FROM appconsulta.cnpj WHERE id=$1) as cnpj LEFT OUTER JOIN 
        (SELECT trackcnpj,  array_agg(year) as sent from appconsulta.years_tpi group by trackcnpj) as years 
        on cnpj.id=years.trackcnpj LEFT JOIN appconsulta.comments as comments on comments.id=cnpj.comment_id 
        order by cnpj.nome_empresa;`;

    return (await executeQueryFunction(async (db) => db.query(query, [id]))).rows;
}

async function insertSentYearTPI(data) {
    const { id, year } = data;
    const queryInsertYearsTpi = "INSERT INTO appconsulta.years_tpi VALUES(default, $2, $1);";
    await executeQueryFunction(async (db) => db.query(queryInsertYearsTpi, [id, year]));
}
    
async function getAllJoinTPI() {
    const query = `SELECT cnpj.id, cnpj.status, cnpj.cnpj, cnpj.nome_empresa, cnpj.municipio, cnpj.comment_id, 
    comments.comment_text, years.sent from appconsulta.cnpj as cnpj LEFT OUTER JOIN (SELECT trackcnpj,  array_agg(year) 
    as sent from appconsulta.years_tpi group by trackcnpj) as years on cnpj.id=years.trackcnpj LEFT JOIN 
    appconsulta.comments as comments on comments.id=cnpj.comment_id order by cnpj.nome_empresa;`;

    return (await executeQueryFunction(async (db) => db.query(query))).rows;
}

async function deleteSentYearTPI(data) {
    const { id, year } = data;
    const queryDeleteSentYearsTpi = `DELETE FROM appconsulta.years_tpi WHERE year= $2 AND trackcnpj= $1;`;

    await executeQueryFunction(async (db) => db.query(queryDeleteSentYearsTpi, [id, year]));
}

export { getAllJoinTPI, getCnpjJoinTPI, insertSentYearTPI, deleteSentYearTPI}