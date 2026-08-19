// assets/js/auth-guard.js
// ============================================================
// PROTEÇÃO DE PÁGINAS — CriativaMente Academy
// ============================================================
// Inclua em QUALQUER página que exige login: painel do aluno,
// curso.html, aula.html, etc.
//
//   <body class="auth-checking">
//     ...conteúdo...
//     <script type="module" src="/assets/js/auth-guard.js"></script>
//   </body>
//
// O que este arquivo garante, nesta ordem, antes de liberar a página:
//   1) existe um usuário autenticado (senão, manda para /login.html)
//   2) a conta dele está com status "ativa" no Firestore (senão,
//      desloga e manda para /login.html com aviso)
// A terceira validação do sistema (curso liberado) NÃO é feita aqui
// — é específica de cada curso/aula e fica em content-loader.js.
// ============================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { registrarSessaoAtual } from "./session-control.js";
import { sanitizarRedirect } from "./redirect-utils.js";

const PAGINA_LOGIN = "/login.html";

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    const destinoAtual = window.location.pathname + window.location.search;
    const destinoSeguro = sanitizarRedirect(destinoAtual);
    window.location.replace(`${PAGINA_LOGIN}?redirect=${encodeURIComponent(destinoSeguro)}`);
    return;
  }

  const docUsuario = await getDoc(doc(db, "usuarios", usuario.uid));
  const dadosConta = docUsuario.exists() ? docUsuario.data() : null;

  if (!dadosConta || dadosConta.status !== "ativa") {
    await auth.signOut();
    window.location.replace(`${PAGINA_LOGIN}?motivo=conta-inativa`);
    return;
  }

  // Bookkeeping de dispositivo/sessão — não bloqueia nada (ver session-control.js).
  registrarSessaoAtual(usuario.uid).catch(() => {
    /* falha aqui nunca deve impedir o acesso do aluno */
  });

  document.body.classList.remove("auth-checking");
  document.body.classList.add("auth-ok");

  document.dispatchEvent(
    new CustomEvent("cm-auth-ready", { detail: { usuario, dadosConta } })
  );
});
