// server/db.ts
// Este arquivo agora serve como um stub para o novo backend unificado com o Firestore.
// Todas as rotas de API migraram para o Firestore para garantir sincronização em tempo real entre dispositivos.

export const db = {
  async query(sql: string, params: any[] = []): Promise<any[]> {
    console.warn("⚠️ Chamada legada a db.query interceptada. O sistema está utilizando Firestore.");
    return [];
  },
  async exec(sql: string, params: any[] = []): Promise<any> {
    console.warn("⚠️ Chamada legada a db.exec interceptada. O sistema está utilizando Firestore.");
    return { lastID: 0, changes: 0 };
  }
};

export async function inicializarBancoDeDados() {
  console.log("☁️ [Banco de Dados] Utilizando Firestore do Firebase como banco de dados na nuvem.");
  console.log("📱 [Sincronização] Todos os dispositivos compartilharão o mesmo banco de dados em tempo real.");
}
