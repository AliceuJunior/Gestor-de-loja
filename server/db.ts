import pg from "pg";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;

interface DBInterface {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  exec: (sql: string, params?: any[]) => Promise<any>;
}

let dbInstance: DBInterface;

if (databaseUrl) {
  console.log("🐘 [Banco de Dados] Conectando ao PostgreSQL via DATABASE_URL...");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  dbInstance = {
    async query(sql: string, params: any[] = []): Promise<any[]> {
      const res = await pool.query(sql, params);
      return res.rows;
    },
    async exec(sql: string, params: any[] = []): Promise<any> {
      const res = await pool.query(sql, params);
      return res;
    }
  };
} else {
  const dbPath = path.join(process.cwd(), "database.db");
  console.log(`sqlite_connection: Conectando ao SQLite local em ${dbPath}...`);
  
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("❌ Erro ao abrir banco SQLite local:", err);
    } else {
      console.log("💾 [Banco de Dados] SQLite conectado com sucesso!");
    }
  });

  dbInstance = {
    query(sql: string, params: any[] = []): Promise<any[]> {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // No SQLite, os booleanos vêm como 1 e 0. Faremos um parse leve no retorno se necessário,
            // ou faremos no controller
            resolve(rows || []);
          }
        });
      });
    },
    exec(sql: string, params: any[] = []): Promise<any> {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    }
  };
}

// Inicializar as tabelas se elas não existirem
export async function inicializarBancoDeDados() {
  console.log("🛠️ [Banco de Dados] Verificando e criando tabelas se necessário...");

  // Para compatibilidade, usamos sintaxe SQL padrão aceita por PostgreSQL e SQLite
  const queries = [
    // 1. Manutenções
    `CREATE TABLE IF NOT EXISTS manutencoes (
      id TEXT PRIMARY KEY,
      os TEXT,
      cliente TEXT,
      aparelho TEXT,
      marca TEXT,
      modelo TEXT,
      cor TEXT,
      situacao TEXT,
      valorPeca REAL,
      maoDeObra REAL,
      valorCobrado REAL,
      lucro REAL,
      pagoPeloCliente INTEGER, -- Usamos INTEGER como boolean para compatibilidade SQLite/Postgres
      pecaPaga INTEGER,
      data TEXT,
      garantiaAte TEXT,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 2. Vendas
    `CREATE TABLE IF NOT EXISTS vendas (
      id TEXT PRIMARY KEY,
      data TEXT,
      debito REAL,
      credito REAL,
      pix REAL,
      dinheiro REAL,
      total REAL,
      observacao TEXT,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 3. Despesas
    `CREATE TABLE IF NOT EXISTS despesas (
      id TEXT PRIMARY KEY,
      descricao TEXT,
      categoria TEXT,
      valor REAL,
      paga INTEGER,
      dataVencimento TEXT,
      tipo TEXT,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 4. Retiradas
    `CREATE TABLE IF NOT EXISTS retiradas (
      id TEXT PRIMARY KEY,
      valor REAL,
      data TEXT,
      observacao TEXT,
      socio TEXT,
      formaPagamento TEXT,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 5. Pedidos de Compra
    `CREATE TABLE IF NOT EXISTS pedidos_compra (
      id TEXT PRIMARY KEY,
      produto TEXT,
      quantidadeEstimada REAL,
      status TEXT,
      data TEXT,
      observacao TEXT,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 6. Avisos
    `CREATE TABLE IF NOT EXISTS avisos (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      conteudo TEXT,
      categoria TEXT,
      data TEXT,
      autor TEXT,
      urgente INTEGER,
      resolvido INTEGER,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 7. Contas PagBank
    `CREATE TABLE IF NOT EXISTS contas_pagbank (
      id TEXT PRIMARY KEY,
      nomeOuCnpj TEXT,
      valor REAL,
      ativa INTEGER,
      criadoPor TEXT,
      criadoEm TEXT,
      modificadoPor TEXT,
      modificadoEm TEXT
    )`,

    // 8. Histórico de Compras (Registro Gasto Compra)
    `CREATE TABLE IF NOT EXISTS historico_compras (
      id TEXT PRIMARY KEY,
      mesOuData TEXT,
      valor REAL,
      tipo TEXT
    )`,

    // 9. Configurações Globais (Tabela com uma única linha)
    `CREATE TABLE IF NOT EXISTS configuracoes (
      id TEXT PRIMARY KEY,
      reservaMinima REAL,
      despesasFixasEstimadas REAL,
      margemLucroVendas REAL,
      compraReposicaoValor REAL,
      compraReposicaoProximaData TEXT,
      compraReposicaoAtiva INTEGER,
      metaFaturamento REAL
    )`,

    // 10. Caixa Físico (Tabela com uma única linha)
    `CREATE TABLE IF NOT EXISTS caixa (
      id TEXT PRIMARY KEY,
      saldo REAL
    )`
  ];

  for (const q of queries) {
    try {
      await dbInstance.exec(q);
    } catch (err) {
      console.error("❌ Erro ao criar tabela com query:", q.substring(0, 100), err);
    }
  }

  // Inserir dados padrão em configurações e caixa se não existirem
  try {
    const configExistente = await dbInstance.query("SELECT id FROM configuracoes WHERE id = 'global'");
    if (configExistente.length === 0) {
      await dbInstance.exec(
        `INSERT INTO configuracoes (id, reservaMinima, despesasFixasEstimadas, margemLucroVendas, compraReposicaoValor, compraReposicaoProximaData, compraReposicaoAtiva, metaFaturamento) 
         VALUES ('global', 5000, 3000, 40, 7000, '', 0, 15000)`
      );
      console.log("✅ Configurações globais padrão inseridas com sucesso.");
    }

    const caixaExistente = await dbInstance.query("SELECT id FROM caixa WHERE id = 'fisico'");
    if (caixaExistente.length === 0) {
      await dbInstance.exec("INSERT INTO caixa (id, saldo) VALUES ('fisico', 0)");
      console.log("✅ Caixa físico inicial criado com sucesso.");
    }
  } catch (err) {
    console.error("❌ Erro ao inicializar valores padrão:", err);
  }

  console.log("🚀 [Banco de Dados] Banco inicializado e pronto para uso!");
}

export const db = dbInstance;
