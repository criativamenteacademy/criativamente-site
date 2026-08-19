// assets/js/progress.js
// ============================================================
// PROGRESSO DO ALUNO — CriativaMente Academy
// ============================================================
// Guarda, por curso, quais aulas o aluno já concluiu e qual foi a
// última aula acessada — é o que alimenta o botão "Continuar de onde
// parou" no painel. Documento: progresso/{uid}_{cursoId}.
// As regras do Firestore garantem que um aluno só grava progresso em
// um curso que ele realmente tem liberado.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function idProgresso(uid, cursoId) {
  return `${uid}_${cursoId}`;
}

export async function buscarProgresso(uid, cursoId) {
  const referencia = doc(db, "progresso", idProgresso(uid, cursoId));
  const snapshot = await getDoc(referencia);
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Chamado sempre que o aluno abre uma aula — registra qual foi a
 * última aula vista, para o botão "Continuar" saber para onde levar.
 */
export async function registrarUltimaAula(uid, cursoId, moduloId, aulaId) {
  const referencia = doc(db, "progresso", idProgresso(uid, cursoId));
  await setDoc(
    referencia,
    {
      uid,
      cursoId,
      ultimoModulo: moduloId,
      ultimaAula: aulaId,
      atualizadoEm: serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Marca uma aula como concluída (usado pelo botão "Concluir aula").
 */
export async function marcarAulaConcluida(uid, cursoId, aulaId) {
  const progressoAtual = await buscarProgresso(uid, cursoId);
  const aulasConcluidas = (progressoAtual && progressoAtual.aulasConcluidas) || {};
  aulasConcluidas[aulaId] = true;

  const referencia = doc(db, "progresso", idProgresso(uid, cursoId));
  await setDoc(
    referencia,
    {
      uid,
      cursoId,
      aulasConcluidas,
      atualizadoEm: serverTimestamp()
    },
    { merge: true }
  );
}
