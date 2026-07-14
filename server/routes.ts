import express from "express";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { firestoreDb } from "./firebase.ts";

export const apiRouter = express.Router();

// Middleware para decodificar JSON
apiRouter.use(express.json());

// Função utilitária para converter booleanos para 1/0 se necessário
function boolToInt(val: any): number {
  if (val === true || val === "true" || val === 1 || val === "1") return 1;
  return 0;
}

// Função utilitária para converter 1/0 ou string para boolean
function intToBool(val: any): boolean {
  return val === 1 || val === "1" || val === true || val === "true";
}

// ==========================================================================
// Rotas de Manutenções
// ==========================================================================
apiRouter.get("/manutencoes", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "manutencoes"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: docSnap.id,
        pagoPeloCliente: intToBool(data.pagoPeloCliente),
        pecaPaga: intToBool(data.pecaPaga),
      });
    });
    // Ordenar por ID decrescente
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
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
    // Salvar no Firestore
    await setDoc(doc(firestoreDb, "manutencoes", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/manutencoes/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "manutencoes", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "vendas"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/vendas", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "vendas", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/vendas/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "vendas", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "despesas"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: docSnap.id,
        paga: intToBool(data.paga),
      });
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/despesas", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "despesas", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/despesas/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "despesas", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "retiradas"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/retiradas", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "retiradas", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/retiradas/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "retiradas", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "pedidos_compra"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/pedidos_compra", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "pedidos_compra", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/pedidos_compra/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "pedidos_compra", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "avisos"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: docSnap.id,
        urgente: intToBool(data.urgente),
        resolvido: intToBool(data.resolvido),
      });
    });
    list.sort((a, b) => b.id.localeCompare(a.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/avisos", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "avisos", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/avisos/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "avisos", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "contas_pagbank"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: docSnap.id,
        ativa: intToBool(data.ativa),
      });
    });
    list.sort((a, b) => a.id.localeCompare(b.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/contas_pagbank", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "contas_pagbank", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/contas_pagbank/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "contas_pagbank", req.params.id));
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
    const querySnapshot = await getDocs(collection(firestoreDb, "historico_compras"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => a.id.localeCompare(b.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/historico_compras", async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: "O campo id é obrigatório." });
    }
    await setDoc(doc(firestoreDb, "historico_compras", item.id), item);
    res.json({ success: true, id: item.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/historico_compras/:id", async (req, res) => {
  try {
    await deleteDoc(doc(firestoreDb, "historico_compras", req.params.id));
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
    const docSnap = await getDoc(doc(firestoreDb, "configuracoes", "global"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      res.json({
        reservaMinima: data.reservaMinima ?? 10000.00,
        despesasFixasEstimadas: data.despesasFixasEstimadas ?? 2450.00,
        margemLucroVendas: data.margemLucroVendas ?? 40.00,
        compraReposicaoValor: data.compraReposicaoValor ?? 7000.00,
        compraReposicaoProximaData: data.compraReposicaoProximaData ?? "2026-07-20",
        compraReposicaoAtiva: intToBool(data.compraReposicaoAtiva ?? true),
        metaFaturamento: data.metaFaturamento ?? 15000.00
      });
    } else {
      const defaults = {
        reservaMinima: 10000.00,
        despesasFixasEstimadas: 2450.00,
        margemLucroVendas: 40.00,
        compraReposicaoValor: 7000.00,
        compraReposicaoProximaData: "2026-07-20",
        compraReposicaoAtiva: true,
        metaFaturamento: 15000.00
      };
      await setDoc(doc(firestoreDb, "configuracoes", "global"), defaults);
      res.json(defaults);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/configuracoes", async (req, res) => {
  try {
    const item = req.body;
    await setDoc(doc(firestoreDb, "configuracoes", "global"), {
      reservaMinima: item.reservaMinima,
      despesasFixasEstimadas: item.despesasFixasEstimadas,
      margemLucroVendas: item.margemLucroVendas,
      compraReposicaoValor: item.compraReposicaoValor,
      compraReposicaoProximaData: item.compraReposicaoProximaData,
      compraReposicaoAtiva: intToBool(item.compraReposicaoAtiva),
      metaFaturamento: item.metaFaturamento
    });
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
    const docSnap = await getDoc(doc(firestoreDb, "caixa", "fisico"));
    if (docSnap.exists()) {
      res.json({ saldo: docSnap.data().saldo });
    } else {
      const defaults = { saldo: 1500.00 };
      await setDoc(doc(firestoreDb, "caixa", "fisico"), defaults);
      res.json(defaults);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/caixa", async (req, res) => {
  try {
    const { saldo } = req.body;
    await setDoc(doc(firestoreDb, "caixa", "fisico"), { saldo });
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

    const tabelas = [
      "manutencoes", "vendas", "despesas", "retiradas",
      "pedidos_compra", "avisos", "contas_pagbank", "historico_compras"
    ];

    // Excluir coleções operacionais no Firestore
    for (const tab of tabelas) {
      const querySnapshot = await getDocs(collection(firestoreDb, tab));
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(firestoreDb, tab, docSnap.id));
      }
    }

    if (acao === "carregar_demonstracao" && dados) {
      console.log("📥 Carregando dados de demonstração no Firestore...");

      // Carregar manutenções
      if (Array.isArray(dados.manutencoes)) {
        for (const item of dados.manutencoes) {
          await setDoc(doc(firestoreDb, "manutencoes", item.id), item);
        }
      }

      // Carregar vendas
      if (Array.isArray(dados.vendas)) {
        for (const item of dados.vendas) {
          await setDoc(doc(firestoreDb, "vendas", item.id), item);
        }
      }

      // Carregar despesas
      if (Array.isArray(dados.despesas)) {
        for (const item of dados.despesas) {
          await setDoc(doc(firestoreDb, "despesas", item.id), item);
        }
      }

      // Carregar retiradas
      if (Array.isArray(dados.retiradas)) {
        for (const item of dados.retiradas) {
          await setDoc(doc(firestoreDb, "retiradas", item.id), item);
        }
      }

      // Carregar pedidos
      if (Array.isArray(dados.pedidos_compra)) {
        for (const item of dados.pedidos_compra) {
          await setDoc(doc(firestoreDb, "pedidos_compra", item.id), item);
        }
      }

      // Carregar avisos
      if (Array.isArray(dados.avisos)) {
        for (const item of dados.avisos) {
          await setDoc(doc(firestoreDb, "avisos", item.id), item);
        }
      }

      // Carregar contas PagBank
      if (Array.isArray(dados.contas_pagbank)) {
        for (const item of dados.contas_pagbank) {
          await setDoc(doc(firestoreDb, "contas_pagbank", item.id), item);
        }
      }

      // Carregar histórico compras
      if (Array.isArray(dados.historico_compras)) {
        for (const item of dados.historico_compras) {
          await setDoc(doc(firestoreDb, "historico_compras", item.id), item);
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

  console.log(`☁️ [Sincronizador Firestore] Sincronizando coleção '${colecao}' com ${lista.length} itens locais...`);

  try {
    const querySnapshot = await getDocs(collection(firestoreDb, colecao));
    const idsNoBanco = querySnapshot.docs.map(docSnap => docSnap.id);
    const idsNaNovaLista = new Set(lista.filter(item => item && item.id).map(item => item.id));

    // 1. Deleta os que sumiram
    for (const id of idsNoBanco) {
      if (!idsNaNovaLista.has(id)) {
        await deleteDoc(doc(firestoreDb, colecao, id));
      }
    }

    // 2. Upsert os itens da lista
    for (const item of lista) {
      if (!item || !item.id) continue;
      await setDoc(doc(firestoreDb, colecao, item.id), item);
    }

    res.json({ success: true, count: lista.length });
  } catch (err: any) {
    console.error(`❌ [Sincronizador Firestore] Erro ao sincronizar coleção ${colecao}:`, err);
    res.status(500).json({ error: err.message });
  }
});
