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
 * A chave usada é "moduloId_aulaId" (ex: "modulo-2_aula-1"), não só
 * "aulaId" — isso evita que a Aula 1 de módulos diferentes sejam
 * tratadas como a mesma aula concluída.
 */
export async function marcarAulaConcluida(uid, cursoId, moduloId, aulaId) {
  const progressoAtual = await buscarProgresso(uid, cursoId);
  const aulasConcluidas = (progressoAtual && progressoAtual.aulasConcluidas) || {};
  const chave = `${moduloId}_${aulaId}`;
  aulasConcluidas[chave] = true;

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

  return aulasConcluidas;
}

/**
 * Confere se o aluno concluiu TODAS as aulas do curso (recebe o total
 * já contado por quem chamou) e, se sim, grava a data de conclusão
 * (campo "concluidoEm") — só na primeira vez, sem sobrescrever se já
 * existir. É esse campo que libera a página do certificado.
 * Retorna true se o curso está (ou acabou de ficar) concluído.
 */
export async function verificarEMarcarConclusao(uid, cursoId, totalAulas) {
  const progressoAtual = await buscarProgresso(uid, cursoId);
  const aulasConcluidas = (progressoAtual && progressoAtual.aulasConcluidas) || {};
  const concluidas = Object.keys(aulasConcluidas).length;

  if (!totalAulas || concluidas < totalAulas) {
    return false;
  }

  if (progressoAtual && progressoAtual.concluidoEm) {
    return true;
  }

  const referencia = doc(db, "progresso", idProgresso(uid, cursoId));
  await setDoc(
    referencia,
    {
      uid,
      cursoId,
      concluidoEm: serverTimestamp()
    },
    { merge: true }
  );

  return true;
}
