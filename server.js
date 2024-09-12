const express = require('express');
const cors = require('cors');
require('dotenv').config();  // Carrega as variáveis de ambiente do .env

const salesRoutes = require('./routes/sales');
const evolutionRoutes = require('./routes/evolution');

const app = express();
app.use(cors());  // Permitir requisições do frontend

// Usar as rotas de vendas e evolução mensal
app.use('/api', salesRoutes);
app.use('/api', evolutionRoutes);

// Porta do servidor vinda do .env
const PORT = process.env.SERVER_PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
