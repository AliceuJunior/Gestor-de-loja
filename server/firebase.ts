import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Carregar configuração do Firebase a partir do arquivo na raiz
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Inicializar aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore com o Database ID correto
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || "ai-studio-gestordaloja-5c64764b-8176-4017-84b0-4b6cdcef7d58");

console.log("🔥 [Firebase Backend] Conectado com sucesso ao Firestore:", firebaseConfig.firestoreDatabaseId);
