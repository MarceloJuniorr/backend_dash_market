const express = require('express');
const { queryDatabase } = require('../db/firebird');
const router = express.Router();

// Rota para obter vendas detalhadas por período com produtos agrupados
router.get('/sales', async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: "Informe 'startDate' e 'endDate' nos parâmetros." });
    }

    try {
        const query = `
      SELECT
        v.CODIGO,
        v.DATA_EMISSAO,
        v.hora,
        v.nome,
        u.login,
        v.SUBTOTAL,
        v.DESCONTO,
        v.TOTAL AS TOTAL_VENDA,
        v.OBSERVACOES,
        v.SITUACAO,
        p.item,
        p.id_produto,
        prd.descricao,
        p.qtd,
        p.total AS TOTAL_ITEM
      FROM 
        VENDAS_MASTER v
      INNER JOIN 
        VENDAS_DETALHE p ON (v.codigo = p.fkvenda)
      INNER JOIN 
        USUARIOS u ON (v.fk_usuario = u.codigo)
      INNER JOIN
        PRODUTO prd ON (p.id_produto = prd.codigo)
      WHERE 
        v.SITUACAO <> 'C'
        AND v.DATA_EMISSAO BETWEEN ? AND ?;
    `;

        const result = await queryDatabase(query, [startDate, endDate]);

        // Objeto para agrupar vendas e produtos
        const vendasMap = {};

        // Processa o resultado agrupando por venda
        result.forEach(row => {
            const codigoVenda = row.CODIGO;

            // Se a venda ainda não foi adicionada, cria o objeto
            if (!vendasMap[codigoVenda]) {
                vendasMap[codigoVenda] = {
                    codigo: row.CODIGO,
                    dataEmissao: row.DATA_EMISSAO,
                    hora: row.HORA,
                    nome: row.NOME,
                    login: row.LOGIN,
                    subtotal: row.SUBTOTAL,
                    desconto: row.DESCONTO,
                    totalVenda: row.TOTAL_VENDA,
                    observacoes: row.OBSERVACOES,
                    situacao: row.SITUACAO,
                    produtos: [] // Inicializa o array de produtos
                };
            }

            // Adiciona o produto no array "produtos" da venda
            vendasMap[codigoVenda].produtos.push({
                item: row.ITEM,
                idProduto: row.ID_PRODUTO,
                descricao: row.DESCRICAO,
                quantidade: row.QTD,
                totalItem: row.TOTAL_ITEM
            });
        });

        // Converte o objeto para um array de vendas
        const vendas = Object.values(vendasMap);

        res.json(vendas);
    } catch (error) {
        console.error('Erro ao buscar vendas detalhadas:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de vendas.' });
    }
});

module.exports = router;
