import express from "express";
import { db } from "./db.ts";

export const apiRouter = express.Router();

// Middleware para decodificar JSON
apiRouter.use(express.json());

// Função utilitária para converter booleanos para 1/0 ao salvar
function boolToInt(val: any): number {
  if (val === true || val === "true" || val === 1 || val === "1") return 1;
  return 0;
}

// Função utilitária para converter 1/0 para boolean ao retornar
function intToBool(val: any): boolean {
  return val === 1 || val === "1" || val === true;
}

// ==========================================================================
// Rotas de Manutenções
// ==========================================================================
apiRouter.get("/manutencoes", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM manutencoes ORDER BY id DESC");
    const formatted = rows.map((r: any) => ({
      ...r,
      pagoPeloCliente: intToBool(r.pagopelocliente !== undefined ? r.pagopelocliente : r.pagoPeloCliente),
      pecaPaga: intToBool(r.pecapaga !== undefined ? r.pecapaga : r.pecaPaga),
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/manutencoes", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }

    // Upsert genérico para Postgres / SQLite
    const existing = await db.query("SELECT id FROM manutencoes WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE manutencoes SET 
          os = $2, cliente = $3, aparelho = $4, marca = $5, modelo = $6, cor = $7, 
          situacao = $8, valorPeca = $9, maoDeObra = $10, valorCobrado = $11, lucro = $12, 
          pagoPeloCliente = $13, pecaPaga = $14, data = $15, garantiaAte = $16,
          modificadoPor = $17, modificadoEm = $18
         WHERE id = $1`,
        [
          item.id, item.os, item.cliente, item.aparelho, item.marca, item.modelo, item.cor,
          item.situacao, item.valorPeca, item.maoDeObra, item.valorCobrado, item.lucro,
          boolToInt(item.pagoPeloCliente), boolToInt(item.pecaPaga), item.data, item.garantiaAte,
          item.modificadoPor, item.modificadoEm
        ]
      );
    } else {
      await db.exec(
        `INSERT INTO manutencoes (
          id, os, cliente, aparelho, marca, modelo, cor, situacao, valorPeca, maoDeObra, 
          valorCobrado, lucro, pagoPeloCliente, pecaPaga, data, garantiaAte, criadoPor, criadoEm
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          item.id, item.os, item.cliente, item.aparelho, item.marca, item.modelo, item.cor,
          item.situacao, item.valorPeca, item.maoDeObra, item.valorCobrado, item.lucro,
          boolToInt(item.pagoPeloCliente), boolToInt(item.pecaPaga), item.data, item.garantiaAte,
          item.criadoPor, item.criadoEm
        ]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/manutencoes/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM manutencoes WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Vendas
// ==========================================================================
apiRouter.get("/vendas", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM vendas ORDER BY id DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/vendas", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM vendas WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE vendas SET 
          data = $2, debito = $3, credito = $4, pix = $5, dinheiro = $6, total = $7, 
          observacao = $8, modificadoPor = $9, modificadoEm = $10
         WHERE id = $1`,
        [item.id, item.data, item.debito, item.credito, item.pix, item.dinheiro, item.total, item.observacao, item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO vendas (id, data, debito, credito, pix, dinheiro, total, observacao, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [item.id, item.data, item.debito, item.credito, item.pix, item.dinheiro, item.total, item.observacao, item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/vendas/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM vendas WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Despesas
// ==========================================================================
apiRouter.get("/despesas", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM despesas ORDER BY id DESC");
    const formatted = rows.map((r: any) => ({
      ...r,
      paga: intToBool(r.paga),
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/despesas", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM despesas WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE despesas SET 
          descricao = $2, categoria = $3, valor = $4, paga = $5, dataVencimento = $6, 
          tipo = $7, modificadoPor = $8, modificadoEm = $9
         WHERE id = $1`,
        [item.id, item.descricao, item.categoria, item.valor, boolToInt(item.paga), item.dataVencimento, item.tipo, item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO despesas (id, descricao, categoria, valor, paga, dataVencimento, tipo, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [item.id, item.descricao, item.categoria, item.valor, boolToInt(item.paga), item.dataVencimento, item.tipo, item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/despesas/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM despesas WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Retiradas
// ==========================================================================
apiRouter.get("/retiradas", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM retiradas ORDER BY id DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/retiradas", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM retiradas WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE retiradas SET 
          valor = $2, data = $3, observacao = $4, socio = $5, formaPagamento = $6, 
          modificadoPor = $7, modificadoEm = $8
         WHERE id = $1`,
        [item.id, item.valor, item.data, item.observacao, item.socio, item.formaPagamento, item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO retiradas (id, valor, data, observacao, socio, formaPagamento, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.valor, item.data, item.observacao, item.socio, item.formaPagamento, item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/retiradas/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM retiradas WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Pedidos de Compra
// ==========================================================================
apiRouter.get("/pedidos_compra", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM pedidos_compra ORDER BY id DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/pedidos_compra", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM pedidos_compra WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE pedidos_compra SET 
          produto = $2, quantidadeEstimada = $3, status = $4, data = $5, observacao = $6, 
          modificadoPor = $7, modificadoEm = $8
         WHERE id = $1`,
        [item.id, item.produto, item.quantidadeEstimada, item.status, item.data, item.observacao, item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO pedidos_compra (id, produto, quantidadeEstimada, status, data, observacao, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.produto, item.quantidadeEstimada, item.status, item.data, item.observacao, item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/pedidos_compra/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM pedidos_compra WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Avisos
// ==========================================================================
apiRouter.get("/avisos", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM avisos ORDER BY id DESC");
    const formatted = rows.map((r: any) => ({
      ...r,
      urgente: intToBool(r.urgente),
      resolvido: intToBool(r.resolvido),
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/avisos", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM avisos WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE avisos SET 
          titulo = $2, conteudo = $3, categoria = $4, data = $5, autor = $6, 
          urgente = $7, resolvido = $8, modificadoPor = $9, modificadoEm = $10
         WHERE id = $1`,
        [item.id, item.titulo, item.conteudo, item.categoria, item.data, item.autor, boolToInt(item.urgente), boolToInt(item.resolvido), item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO avisos (id, titulo, conteudo, categoria, data, autor, urgente, resolvido, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [item.id, item.titulo, item.conteudo, item.categoria, item.data, item.autor, boolToInt(item.urgente), boolToInt(item.resolvido), item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/avisos/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM avisos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Contas PagBank
// ==========================================================================
apiRouter.get("/contas_pagbank", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM contas_pagbank ORDER BY id ASC");
    const formatted = rows.map((r: any) => ({
      ...r,
      ativa: intToBool(r.ativa),
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/contas_pagbank", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM contas_pagbank WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE contas_pagbank SET 
          nomeOuCnpj = $2, valor = $3, ativa = $4, modificadoPor = $5, modificadoEm = $6
         WHERE id = $1`,
        [item.id, item.nomeOuCnpj, item.valor, boolToInt(item.ativa), item.modificadoPor, item.modificadoEm]
      );
    } else {
      await db.exec(
        `INSERT INTO contas_pagbank (id, nomeOuCnpj, valor, ativa, criadoPor, criadoEm) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, item.nomeOuCnpj, item.valor, boolToInt(item.ativa), item.criadoPor, item.criadoEm]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/contas_pagbank/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM contas_pagbank WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas do Histórico de Compras
// ==========================================================================
apiRouter.get("/historico_compras", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM historico_compras ORDER BY id ASC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/historico_compras", async (req, res) => {
  try {
    const item = req.body;
    const existing = await db.query("SELECT id FROM historico_compras WHERE id = $1", [item.id]);
    if (existing.length > 0) {
      await db.exec(
        `UPDATE historico_compras SET 
          mesOuData = $2, valor = $3, tipo = $4
         WHERE id = $1`,
        [item.id, item.mesOuData, item.valor, item.tipo]
      );
    } else {
      await db.exec(
        `INSERT INTO historico_compras (id, mesOuData, valor, tipo) 
         VALUES ($1, $2, $3, $4)`,
        [item.id, item.mesOuData, item.valor, item.tipo]
      );
    }
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/historico_compras/:id", async (req, res) => {
  try {
    await db.exec("DELETE FROM historico_compras WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Configurações Globais
// ==========================================================================
apiRouter.get("/configuracoes", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM configuracoes WHERE id = 'global'");
    if (rows.length > 0) {
      const config = rows[0];
      res.json({
        reservaMinima: config.reservaminima !== undefined ? config.reservaminima : config.reservaMinima,
        despesasFixasEstimadas: config.despesasfixasestimadas !== undefined ? config.despesasfixasestimadas : config.despesasFixasEstimadas,
        margemLucroVendas: config.margemlucrovendas !== undefined ? config.margemlucrovendas : config.margemLucroVendas,
        compraReposicaoValor: config.comprareposicaovalor !== undefined ? config.comprareposicaovalor : config.compraReposicaoValor,
        compraReposicaoProximaData: config.comprareposicaoproximadata !== undefined ? config.comprareposicaoproximadata : config.compraReposicaoProximaData,
        compraReposicaoAtiva: intToBool(config.comprareposicaoativa !== undefined ? config.comprareposicaoativa : config.compraReposicaoAtiva),
        metaFaturamento: config.metafaturamento !== undefined ? config.metafaturamento : config.metaFaturamento
      });
    } else {
      res.status(404).json({ error: "Configurações não encontradas" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/configuracoes", async (req, res) => {
  try {
    const item = req.body;
    await db.exec(
      `UPDATE configuracoes SET 
        reservaMinima = $1, despesasFixasEstimadas = $2, margemLucroVendas = $3, 
        compraReposicaoValor = $4, compraReposicaoProximaData = $5, 
        compraReposicaoAtiva = $6, metaFaturamento = $7
       WHERE id = 'global'`,
      [
        item.reservaMinima, item.despesasFixasEstimadas, item.margemLucroVendas,
        item.compraReposicaoValor, item.compraReposicaoProximaData,
        boolToInt(item.compraReposicaoAtiva), item.metaFaturamento
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rotas de Caixa Físico
// ==========================================================================
apiRouter.get("/caixa", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM caixa WHERE id = 'fisico'");
    if (rows.length > 0) {
      res.json({ saldo: rows[0].saldo });
    } else {
      res.status(404).json({ error: "Caixa físico não encontrado" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/caixa", async (req, res) => {
  try {
    const { saldo } = req.body;
    await db.exec("UPDATE caixa SET saldo = $1 WHERE id = 'fisico'", [saldo]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rota de Redefinição e Carga de Dados (Zerar ou Importar Dados em Bloco)
// ==========================================================================
apiRouter.post("/redefinir-dados", async (req, res) => {
  try {
    const { acao, dados } = req.body;

    // Limpar as tabelas operacionais
    const tabelas = [
      "manutencoes", "vendas", "despesas", "retiradas",
      "pedidos_compra", "avisos", "contas_pagbank", "historico_compras"
    ];

    for (const tab of tabelas) {
      await db.exec(`DELETE FROM ${tab}`);
    }

    if (acao === "carregar_demonstracao" && dados) {
      console.log("📥 Carregando dados de demonstração no banco SQL...");

      // Carregar manutenções
      if (Array.isArray(dados.manutencoes)) {
        for (const item of dados.manutencoes) {
          await db.exec(
            `INSERT INTO manutencoes (
              id, os, cliente, aparelho, marca, modelo, cor, situacao, valorPeca, maoDeObra, 
              valorCobrado, lucro, pagoPeloCliente, pecaPaga, data, garantiaAte, criadoPor, criadoEm
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              item.id, item.os, item.cliente, item.aparelho, item.marca, item.modelo, item.cor,
              item.situacao, item.valorPeca, item.maoDeObra, item.valorCobrado, item.lucro,
              boolToInt(item.pagoPeloCliente), boolToInt(item.pecaPaga), item.data, item.garantiaAte,
              item.criadoPor, item.criadoEm
            ]
          );
        }
      }

      // Carregar vendas
      if (Array.isArray(dados.vendas)) {
        for (const item of dados.vendas) {
          await db.exec(
            `INSERT INTO vendas (id, data, debito, credito, pix, dinheiro, total, observacao, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [item.id, item.data, item.debito, item.credito, item.pix, item.dinheiro, item.total, item.observacao, item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar despesas
      if (Array.isArray(dados.despesas)) {
        for (const item of dados.despesas) {
          await db.exec(
            `INSERT INTO despesas (id, descricao, categoria, valor, paga, dataVencimento, tipo, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [item.id, item.descricao, item.categoria, item.valor, boolToInt(item.paga), item.dataVencimento, item.tipo, item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar retiradas
      if (Array.isArray(dados.retiradas)) {
        for (const item of dados.retiradas) {
          await db.exec(
            `INSERT INTO retiradas (id, valor, data, observacao, socio, formaPagamento, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.id, item.valor, item.data, item.observacao, item.socio, item.formaPagamento, item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar pedidos
      if (Array.isArray(dados.pedidos_compra)) {
        for (const item of dados.pedidos_compra) {
          await db.exec(
            `INSERT INTO pedidos_compra (id, produto, quantidadeEstimada, status, data, observacao, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.id, item.produto, item.quantidadeEstimada, item.status, item.data, item.observacao, item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar avisos
      if (Array.isArray(dados.avisos)) {
        for (const item of dados.avisos) {
          await db.exec(
            `INSERT INTO avisos (id, titulo, conteudo, categoria, data, autor, urgente, resolvido, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [item.id, item.titulo, item.conteudo, item.categoria, item.data, item.autor, boolToInt(item.urgente), boolToInt(item.resolvido), item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar contas PagBank
      if (Array.isArray(dados.contas_pagbank)) {
        for (const item of dados.contas_pagbank) {
          await db.exec(
            `INSERT INTO contas_pagbank (id, nomeOuCnpj, valor, ativa, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [item.id, item.nomeOuCnpj, item.valor, boolToInt(item.ativa), item.criadoPor, item.criadoEm]
          );
        }
      }

      // Carregar histórico compras
      if (Array.isArray(dados.historico_compras)) {
        for (const item of dados.historico_compras) {
          await db.exec(
            `INSERT INTO historico_compras (id, mesOuData, valor, tipo) 
             VALUES ($1, $2, $3, $4)`,
            [item.id, item.mesOuData, item.valor, item.tipo]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// Rota de Sincronização em Lote de uma Coleção Específica (Local-First Sync Engine)
// ==========================================================================
apiRouter.post("/sincronizar/:colecao", async (req, res) => {
  const { colecao } = req.params;
  const { lista } = req.body;

  if (!Array.isArray(lista)) {
    return res.status(400).json({ error: "O campo lista deve ser um array." });
  }

  console.log(`☁️ [Sincronizador] Sincronizando coleção '${colecao}' com ${lista.length} itens locais...`);

  try {
    const idsNaNovaLista = new Set(lista.filter(item => item && item.id).map(item => item.id));

    if (colecao === "manutencoes") {
      const existingRows = await db.query("SELECT id FROM manutencoes");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      // 1. Deleta os que sumiram
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM manutencoes WHERE id = $1", [id]);
        }
      }

      // 2. Upsert
      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM manutencoes WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE manutencoes SET 
              os = $2, cliente = $3, aparelho = $4, marca = $5, modelo = $6, cor = $7, 
              situacao = $8, valorPeca = $9, maoDeObra = $10, valorCobrado = $11, lucro = $12, 
              pagoPeloCliente = $13, pecaPaga = $14, data = $15, garantiaAte = $16,
              modificadoPor = $17, modificadoEm = $18
             WHERE id = $1`,
            [
              item.id, item.os, item.cliente, item.aparelho, item.marca, item.modelo, item.cor,
              item.situacao, item.valorPeca, item.maoDeObra, item.valorCobrado, item.lucro,
              boolToInt(item.pagoPeloCliente), boolToInt(item.pecaPaga), item.data, item.garantiaAte,
              item.modificadoPor, item.modificadoEm
            ]
          );
        } else {
          await db.exec(
            `INSERT INTO manutencoes (
              id, os, cliente, aparelho, marca, modelo, cor, situacao, valorPeca, maoDeObra, 
              valorCobrado, lucro, pagoPeloCliente, pecaPaga, data, garantiaAte, criadoPor, criadoEm
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              item.id, item.os, item.cliente, item.aparelho, item.marca, item.modelo, item.cor,
              item.situacao, item.valorPeca, item.maoDeObra, item.valorCobrado, item.lucro,
              boolToInt(item.pagoPeloCliente), boolToInt(item.pecaPaga), item.data, item.garantiaAte,
              item.criadoPor, item.criadoEm
            ]
          );
        }
      }

    } else if (colecao === "vendas") {
      const existingRows = await db.query("SELECT id FROM vendas");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM vendas WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM vendas WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE vendas SET 
              data = $2, debito = $3, credito = $4, pix = $5, dinheiro = $6, total = $7, 
              observacao = $8, modificadoPor = $9, modificadoEm = $10
             WHERE id = $1`,
            [item.id, item.data, item.debito, item.credito, item.pix, item.dinheiro, item.total, item.observacao, item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO vendas (id, data, debito, credito, pix, dinheiro, total, observacao, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [item.id, item.data, item.debito, item.credito, item.pix, item.dinheiro, item.total, item.observacao, item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "despesas") {
      const existingRows = await db.query("SELECT id FROM despesas");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM despesas WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM despesas WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE despesas SET 
              descricao = $2, categoria = $3, valor = $4, paga = $5, dataVencimento = $6, 
              tipo = $7, modificadoPor = $8, modificadoEm = $9
             WHERE id = $1`,
            [item.id, item.descricao, item.categoria, item.valor, boolToInt(item.paga), item.dataVencimento, item.tipo, item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO despesas (id, descricao, categoria, valor, paga, dataVencimento, tipo, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [item.id, item.descricao, item.categoria, item.valor, boolToInt(item.paga), item.dataVencimento, item.tipo, item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "retiradas") {
      const existingRows = await db.query("SELECT id FROM retiradas");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM retiradas WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM retiradas WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE retiradas SET 
              valor = $2, data = $3, observacao = $4, socio = $5, formaPagamento = $6, 
              modificadoPor = $7, modificadoEm = $8
             WHERE id = $1`,
            [item.id, item.valor, item.data, item.observacao, item.socio, item.formaPagamento, item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO retiradas (id, valor, data, observacao, socio, formaPagamento, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.id, item.valor, item.data, item.observacao, item.socio, item.formaPagamento, item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "pedidos_compra") {
      const existingRows = await db.query("SELECT id FROM pedidos_compra");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM pedidos_compra WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM pedidos_compra WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE pedidos_compra SET 
              produto = $2, quantidadeEstimada = $3, status = $4, data = $5, observacao = $6, 
              modificadoPor = $7, modificadoEm = $8
             WHERE id = $1`,
            [item.id, item.produto, item.quantidadeEstimada, item.status, item.data, item.observacao, item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO pedidos_compra (id, produto, quantidadeEstimada, status, data, observacao, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.id, item.produto, item.quantidadeEstimada, item.status, item.data, item.observacao, item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "avisos") {
      const existingRows = await db.query("SELECT id FROM avisos");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM avisos WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM avisos WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE avisos SET 
              titulo = $2, conteudo = $3, categoria = $4, data = $5, autor = $6, 
              urgente = $7, resolvido = $8, modificadoPor = $9, modificadoEm = $10
             WHERE id = $1`,
            [item.id, item.titulo, item.conteudo, item.categoria, item.data, item.autor, boolToInt(item.urgente), boolToInt(item.resolvido), item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO avisos (id, titulo, conteudo, categoria, data, autor, urgente, resolvido, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [item.id, item.titulo, item.conteudo, item.categoria, item.data, item.autor, boolToInt(item.urgente), boolToInt(item.resolvido), item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "contas_pagbank") {
      const existingRows = await db.query("SELECT id FROM contas_pagbank");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM contas_pagbank WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM contas_pagbank WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE contas_pagbank SET 
              nomeOuCnpj = $2, valor = $3, ativa = $4, modificadoPor = $5, modificadoEm = $6
             WHERE id = $1`,
            [item.id, item.nomeOuCnpj, item.valor, boolToInt(item.ativa), item.modificadoPor, item.modificadoEm]
          );
        } else {
          await db.exec(
            `INSERT INTO contas_pagbank (id, nomeOuCnpj, valor, ativa, criadoPor, criadoEm) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [item.id, item.nomeOuCnpj, item.valor, boolToInt(item.ativa), item.criadoPor, item.criadoEm]
          );
        }
      }

    } else if (colecao === "historico_compras") {
      const existingRows = await db.query("SELECT id FROM historico_compras");
      const idsNoBanco = existingRows.map((r: any) => r.id);
      
      for (const id of idsNoBanco) {
        if (!idsNaNovaLista.has(id)) {
          await db.exec("DELETE FROM historico_compras WHERE id = $1", [id]);
        }
      }

      for (const item of lista) {
        if (!item || !item.id) continue;
        const exists = await db.query("SELECT id FROM historico_compras WHERE id = $1", [item.id]);
        if (exists.length > 0) {
          await db.exec(
            `UPDATE historico_compras SET 
              mesOuData = $2, valor = $3, tipo = $4
             WHERE id = $1`,
            [item.id, item.mesOuData, item.valor, item.tipo]
          );
        } else {
          await db.exec(
            `INSERT INTO historico_compras (id, mesOuData, valor, tipo) 
             VALUES ($1, $2, $3, $4)`,
            [item.id, item.mesOuData, item.valor, item.tipo]
          );
        }
      }
    }

    res.json({ success: true, count: lista.length });
  } catch (err: any) {
    console.error(`❌ [Sincronizador] Erro ao sincronizar coleção ${colecao}:`, err);
    res.status(500).json({ error: err.message });
  }
});
