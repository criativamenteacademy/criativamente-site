// assets/js/session-control.js
// ============================================================
// CONTROLE DE SESSÕES/DISPOSITIVOS — CriativaMente Academy
// ============================================================
// Este arquivo REGISTRA em qual(is) dispositivo(s) cada aluno abriu
// a plataforma. Ele NÃO bloqueia sessões simultâneas ainda — serve
// como base pronta para ativar isso no futuro.
//
// Por que não bloquear já: impedir de verdade um segundo login
// simultâneo exige decidir a regra de negócio (permite 1 dispositivo?
// 2? desloga o mais antigo automaticamente? avisa o aluno?) e, na
// maioria dos casos, uma Cloud Function para revogar sessão no
// servidor (só JavaScript no navegador não é suficiente, porque um
// aluno mal-intencionado poderia simplesmente não carregar esse
// script). Por isso deixamos a gravação pronta, mas a trava desligada.
// ============================================================

import { db } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CHAVE_DEVICE_ID = "cm_device_id";

// Flag central: enquanto false, o sistema só registra sessões,
// nunca bloqueia. Quando a lógica de bloqueio for implementada
// (provavelmente via Cloud Function), esta constante passa a ser
// consultada antes de negar acesso.
export const BLOQUEIO_SESSAO_SIMULTANEA_ATIVO = false;

function obterOuCriarDeviceId() {
  let id = localStorage.getItem(CHAVE_DEVICE_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAVE_DEVICE_ID, id);
  }
  return id;
}

/**
 * Registra/atualiza o "carimbo" deste dispositivo em
 * usuarios/{uid}/sessoes/{deviceId}. Chamado automaticamente pelo
 * auth-guard.js sempre que uma página protegida confirma o login.
 *
 * Falhas aqui nunca devem impedir o acesso do aluno — é só
 * bookkeeping (ver chamada em auth-guard.js, que ignora erros).
 */
export async function registrarSessaoAtual(uid) {
  const deviceId = obterOuCriarDeviceId();
  const referencia = doc(db, "usuarios", uid, "sessoes", deviceId);

  await setDoc(
    referencia,
    {
      ultimoAcesso: serverTimestamp(),
      userAgent: navigator.userAgent,
      // Campo pronto para o futuro: quando o bloqueio for ativado,
      // uma Cloud Function pode marcar "revogada: true" aqui para
      // forçar logout deste dispositivo específico.
      revogada: false
    },
    { merge: true }
  );

  return deviceId;
}
