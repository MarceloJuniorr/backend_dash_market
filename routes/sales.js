const express = require('express');
const { queryDatabase } = require('../db/firebird');
const router = express.Router();

// Função para calcular o ticket médio
const calcularTicketMedio = (totalVendas, quantidadeVendas) => {
    return quantidadeVendas > 0 ? parseFloat(totalVendas / quantidadeVendas).toFixed(2) : 0;
};

// Função para calcular os itens mais vendidos e o preço médio, agora com a ordenação
const calcularItensMaisVendidos = (vendas) => {
    const itensMap = {};

    vendas.forEach(venda => {
        venda.produtos.forEach(produto => {
            const idProduto = produto.idProduto;

            if (!itensMap[idProduto]) {
                itensMap[idProduto] = {
                    descricao: produto.descricao,
                    totalVendido: 0,
                    totalPreco: 0,
                    quantidadeVendida: 0,
                    ultimaVenda: new Date('2001-01-01T03:00:00.000Z')
                };
            }

            itensMap[idProduto].totalVendido += produto.quantidade;
            itensMap[idProduto].totalPreco += produto.totalItem;
            itensMap[idProduto].quantidadeVendida += 1;
            itensMap[idProduto].ultimaVenda = itensMap[idProduto].ultimaVenda > new Date(produto.ultimaVenda) ? itensMap[idProduto].ultimaVenda : new Date(produto.ultimaVenda)
        });
    });

    // Converte o map para um array e aplica a ordenação
    const itensMaisVendidos = Object.values(itensMap).map(item => ({
        descricao: item.descricao,
        quantidadeVendida: item.totalVendido,
        totalVendido: parseFloat(item.totalPreco).toFixed(2),
        precoMedio: parseFloat(item.totalPreco / item.quantidadeVendida).toFixed(2),
    })).sort((a, b) => {
        if (b.quantidadeVendida === a.quantidadeVendida) {
            // Ordena por ordem alfabética quando a quantidade for igual
            return a.descricao.localeCompare(b.descricao);
        }
        // Ordena pela quantidade vendida (maior para menor)
        return b.quantidadeVendida - a.quantidadeVendida;
    });

    return itensMaisVendidos;
};

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
        let valorTotal = 0; // Variável para somar o valor total das vendas
        let quantidadeVendas = 0; // Contador de quantidade de vendas

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

                // Incrementa o contador de vendas e o valor total
                quantidadeVendas++;
                valorTotal += row.TOTAL_VENDA;
            }

            // Adiciona o produto no array "produtos" da venda
            vendasMap[codigoVenda].produtos.push({
                item: row.ITEM,
                idProduto: row.ID_PRODUTO,
                descricao: row.DESCRICAO,
                quantidade: row.QTD,
                totalItem: row.TOTAL_ITEM,
                dataVenda: row.DATA_EMISSAO
            });
        });

        // Converte o objeto para um array de vendas
        const vendas = Object.values(vendasMap);

        // Calcula as métricas
        const ticketMedio = calcularTicketMedio(valorTotal, quantidadeVendas);
        const itensMaisVendidos = calcularItensMaisVendidos(vendas);
        valorTotal = parseFloat(valorTotal).toFixed(2);

        // Retorna as vendas com informações adicionais
        res.json({
            quantidadeVendas,
            valorTotal,
            ticketMedio,
            itensMaisVendidos,
            vendas
        });
    } catch (error) {
        console.error('Erro ao buscar vendas detalhadas:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de vendas.' });
    }
});

module.exports = router;
