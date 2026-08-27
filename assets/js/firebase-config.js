// assets/js/firebase-config.js
// ============================================================
// CONFIGURAÇÃO CENTRAL DO FIREBASE — CriativaMente Academy
// ============================================================
// Inicializa Authentication, Firestore e App Check. Importado por
// todos os outros arquivos .js da plataforma do aluno.
//
// COMO PREENCHER (obrigatório antes de publicar):
// 1. Firebase Console → ⚙️ Configurações do projeto
// 2. Role até "Seus apps" → selecione o app da Web já registrado
// 3. Copie o objeto "firebaseConfig" mostrado lá e cole abaixo,
//    substituindo os valores de exemplo.
// Nenhuma credencial real foi inserida aqui — os valores abaixo
// são apenas placeholders.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoKHp6riW1htvqBXRU0YBSGkajErqdeJw",
  authDomain: "criativamente-academy.firebaseapp.com",
  projectId: "criativamente-academy",
  storageBucket: "criativamente-academy.firebasestorage.app",
  messagingSenderId: "518569829764",
  appId: "1:518569829764:web:d344c9df13f5c877a6e9d1"
};

const app = initializeApp(firebaseConfig);

// App Check: confirma que as requisições vêm mesmo do site (não de scripts/robôs).
// A chave abaixo é a "Chave de site" do reCAPTCHA — é pública, não é segredo.
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LchkJstAAAAAI0kgJPOmG5aCXz2WA42kO4hqzZQ"),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);
