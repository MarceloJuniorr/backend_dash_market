const Firebird = require('node-firebird');
require('dotenv').config();  // Carrega as variáveis de ambiente do .env

const options = {
    database: process.env.FIREBIRD_DATABASE,  // Caminho completo para o banco de dados Firebird (.fdb)
    user: process.env.FIREBIRD_USER,          // Usuário Firebird (ex: SYSDBA)
    password: process.env.FIREBIRD_PASSWORD,  // Senha (ex: masterkey)
    role: null,                               // Pode ser null se não for necessário
    pageSize: 4096,                           // Tamanho da página do Firebird
    host: process.env.FIREBIRD_HOST || 'localhost',  // O Firebird geralmente está no localhost
    port: process.env.FIREBIRD_PORT || 3050,         // Porta padrão do Firebird é 3050

};

// Função para realizar consultas no banco de dados Firebird
function queryDatabase(query, params = []) {
    return new Promise((resolve, reject) => {
        Firebird.attach(options, (err, db) => {
            if (err) {
                return reject(`Erro ao conectar ao Firebird: ${err}`);
            }

            db.query(query, params, (err, result) => {
                if (err) {
                    db.detach();  // Fecha a conexão com o banco de dados
                    return reject(`Erro ao executar a consulta: ${err}`);
                }

                db.detach();  // Fecha a conexão com o banco de dados
                resolve(result);
            });
        });
    });
}

module.exports = {
    queryDatabase,
};
