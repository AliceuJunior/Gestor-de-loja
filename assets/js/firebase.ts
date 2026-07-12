import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDoc
} from "firebase/firestore";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyC7S5hG2ODDqBUIJCQK7Qkb_BzVf33FjbA",
  authDomain: "gen-lang-client-0254515478.firebaseapp.com",
  projectId: "gen-lang-client-0254515478",
  storageBucket: "gen-lang-client-0254515478.firebasestorage.app",
  messagingSenderId: "400188353594",
  appId: "1:400188353594:web:2b8cf492dd57bc691e5903"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId using standard getFirestore
export const db = getFirestore(app, "ai-studio-gestordaloja-5c64764b-8176-4017-84b0-4b6cdcef7d58");

console.log("🔥 Firebase inicializado com sucesso para sincronização em nuvem!");

// Coleções do Firestore
export const COL_MANUTENCOES = "manutencoes";
export const COL_VENDAS = "vendas";
export const COL_DESPESAS = "despesas";
export const COL_RETIRADAS = "retiradas";
export const COL_PEDIDOS_COMPRA = "pedidos_compra";
export const COL_AVISOS = "avisos";
export const COL_CONTAS_PAGBANK = "contas_pagbank";
export const COL_HISTORICO_COMPRAS = "historico_compras";
export const COL_CONFIGURACOES = "configuracoes";
export const COL_CAIXA = "caixa";

// Função para salvar ou atualizar um item em uma coleção no Firestore
export async function dbSalvarDoc(colecao: string, id: string, dados: any): Promise<void> {
  try {
    const docRef = doc(db, colecao, id);
    // Limpa possíveis valores undefined para evitar erros no Firestore
    const dadosLimpos = JSON.parse(JSON.stringify(dados));
    await setDoc(docRef, dadosLimpos, { merge: true });
    console.log(`☁️ [Firestore] Documento ${id} salvo com sucesso na coleção ${colecao}`);
  } catch (err) {
    console.error(`❌ Erro ao salvar documento ${id} no Firestore:`, err);
  }
}

// Função para deletar um item de uma coleção no Firestore
export async function dbDeletarDoc(colecao: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, colecao, id);
    await deleteDoc(docRef);
    console.log(`☁️ [Firestore] Documento ${id} deletado com sucesso da coleção ${colecao}`);
  } catch (err) {
    console.error(`❌ Erro ao deletar documento ${id} no Firestore:`, err);
  }
}

// Função para escutar alterações em tempo real de uma coleção
export function dbEscutarColecao(
  colecao: string, 
  onUpdate: (dados: any[]) => void
): () => void {
  const colRef = collection(db, colecao);
  return onSnapshot(colRef, (snapshot) => {
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(items);
  }, (err) => {
    console.error(`❌ Erro de escuta em tempo real na coleção ${colecao}:`, err);
  });
}

// Função para escutar alterações em um único documento (ex: configurações globais)
export function dbEscutarDoc(
  colecao: string,
  docId: string,
  onUpdate: (dados: any) => void
): () => void {
  const docRef = doc(db, colecao, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data());
    }
  }, (err) => {
    console.error(`❌ Erro de escuta no documento ${colecao}/${docId}:`, err);
  });
}
