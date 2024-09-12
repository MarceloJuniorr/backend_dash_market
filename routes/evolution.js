const express = require('express');
const { queryDatabase } = require('../db/firebird');
const router = express.Router();

// Rota para obter evolução mensal das vendas
router.get('/sales-evolution', async (req, res) => {
    try {
        const query = `
      SELECT 
        EXTRACT(YEAR FROM data_emissao) AS ano,
        EXTRACT(MONTH FROM data_emissao) AS mes,
        SUM(total) AS total_vendas
      FROM 
        vendas_master
      WHERE 
        situacao <> 'C'
      GROUP BY 
        EXTRACT(YEAR FROM data_emissao),
        EXTRACT(MONTH FROM data_emissao)
      ORDER BY 
        ano, mes;
    `;

        const result = await queryDatabase(query);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar evolução mensal:', error);
        res.status(500).json({ error: 'Erro ao buscar evolução mensal.' });
    }
});

module.exports = router;
