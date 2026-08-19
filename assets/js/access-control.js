// assets/js/access-control.js
// ============================================================
// CONTROLE DE ACESSO A CURSOS — CriativaMente Academy
// ============================================================
// VERSÃO TEMPORÁRIA DE DIAGNÓSTICO — cada função avisa no Console
// exatamente onde falhou, com detalhes. Depois de resolver o
// problema, trocar de volta pela versão limpa (sem os console.log).
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export async function listarMatriculasDoAluno(uid) {
  console.log("[DIAGNOSTICO] Passo 1: buscando matriculas do uid =", uid);
  try {
    const referenciaColecao = collection(db, "matricula");
    const consulta = query(
      referenciaColecao,
      where("uid", "==", uid),
      where("liberado", "==", true)
    );
    const snapshot = await getDocs(consulta);
    console.log("[DIAGNOSTICO] Passo 1 OK. Matriculas encontradas:", snapshot.docs.length);
    snapshot.docs.forEach((d) => console.log("[DIAGNOSTICO] Matricula encontrada:", d.id, d.data()));
    return snapshot.docs.map((d) => d.data());
  } catch (erro) {
    console.error("[DIAGNOSTICO] FALHOU no Passo 1 (listar matriculas). Erro:", erro.code, erro.message);
    throw erro;
  }
}

export async function cursoLiberado(uid, cursoId) {
  const referencia = doc(db, "matricula", `${uid}_${cursoId}`);
  const snapshot = await getDoc(referencia);
  return snapshot.exists() && snapshot.data().liberado === true;
}

export async function buscarCurso(cursoId) {
  console.log("[DIAGNOSTICO] Passo 2: buscando curso =", cursoId);
  try {
    const referencia = doc(db, "cursos", cursoId);
    const snapshot = await getDoc(referencia);
    console.log("[DIAGNOSTICO] Passo 2 OK. Curso existe?", snapshot.exists());
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (erro) {
    console.error("[DIAGNOSTICO] FALHOU no Passo 2 (buscar curso", cursoId, "). Erro:", erro.code, erro.message);
    throw erro;
  }
}

export async function listarCursosDoAluno(uid) {
  const matriculas = await listarMatriculasDoAluno(uid);

  const cursos = await Promise.all(
    matriculas.map(async (matricula) => {
      const curso = await buscarCurso(matricula.cursoId);
      return curso ? { ...curso, matricula } : null;
    })
  );

  return cursos.filter(Boolean);
}

export async function listarModulos(cursoId) {
  console.log("[DIAGNOSTICO] Passo 3: buscando modulos do curso =", cursoId);
  try {
    const referencia = collection(db, "cursos", cursoId, "modulos");
    const snapshot = await getDocs(referencia);
    console.log("[DIAGNOSTICO] Passo 3 OK. Modulos encontrados:", snapshot.docs.length);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  } catch (erro) {
    console.error("[DIAGNOSTICO] FALHOU no Passo 3 (listar modulos do curso", cursoId, "). Erro:", erro.code, erro.message);
    throw erro;
  }
}

export async function listarAulas(cursoId, moduloId) {
  console.log("[DIAGNOSTICO] Passo 4: buscando aulas. curso =", cursoId, "modulo =", moduloId);
  try {
    const referencia = collection(db, "cursos", cursoId, "modulos", moduloId, "aulas");
    const snapshot = await getDocs(referencia);
    console.log("[DIAGNOSTICO] Passo 4 OK. Aulas encontradas:", snapshot.docs.length);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  } catch (erro) {
    console.error("[DIAGNOSTICO] FALHOU no Passo 4 (listar aulas curso=", cursoId, "modulo=", moduloId, "). Erro:", erro.code, erro.message);
    throw erro;
  }
}

export async function primeiraAula(cursoId) {
  const modulos = await listarModulos(cursoId);
  if (modulos.length === 0) return null;

  const aulas = await listarAulas(cursoId, modulos[0].id);
  if (aulas.length === 0) return null;

  return { moduloId: modulos[0].id, aulaId: aulas[0].id };
}
