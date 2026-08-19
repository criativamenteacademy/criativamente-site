// assets/js/access-control.js
// ============================================================
// CONTROLE DE ACESSO A CURSOS — CriativaMente Academy
// ============================================================
// Lê a coleção "matricula" para saber quais cursos cada aluno pode
// ver, e busca os metadados de cursos/módulos/aulas no catálogo
// público. NUNCA lê o campo "conteudo" de uma aula diretamente —
// isso é feito exclusivamente por content-loader.js, que aplica as
// 3 validações de segurança antes de buscar o conteúdo.
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
  const referenciaColecao = collection(db, "matricula");
  const consulta = query(
    referenciaColecao,
    where("uid", "==", uid),
    where("liberado", "==", true)
  );
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map((d) => d.data());
}

export async function cursoLiberado(uid, cursoId) {
  const referencia = doc(db, "matricula", `${uid}_${cursoId}`);
  const snapshot = await getDoc(referencia);
  return snapshot.exists() && snapshot.data().liberado === true;
}

export async function buscarCurso(cursoId) {
  const referencia = doc(db, "cursos", cursoId);
  const snapshot = await getDoc(referencia);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
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
  const referencia = collection(db, "cursos", cursoId, "modulos");
  const snapshot = await getDocs(referencia);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function listarAulas(cursoId, moduloId) {
  const referencia = collection(db, "cursos", cursoId, "modulos", moduloId, "aulas");
  const snapshot = await getDocs(referencia);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function primeiraAula(cursoId) {
  const modulos = await listarModulos(cursoId);
  if (modulos.length === 0) return null;

  const aulas = await listarAulas(cursoId, modulos[0].id);
  if (aulas.length === 0) return null;

  return { moduloId: modulos[0].id, aulaId: aulas[0].id };
}

/**
 * Descobre qual é a próxima aula depois da atual — dentro do mesmo
 * módulo, ou (se a atual for a última do módulo) a primeira aula do
 * próximo módulo. Retorna null se a aula atual for a última do curso
 * inteiro (curso concluído).
 */
export async function proximaAula(cursoId, moduloIdAtual, aulaIdAtual) {
  const aulasDoModulo = await listarAulas(cursoId, moduloIdAtual);
  const indiceAtual = aulasDoModulo.findIndex((a) => a.id === aulaIdAtual);

  if (indiceAtual !== -1 && indiceAtual + 1 < aulasDoModulo.length) {
    const proxima = aulasDoModulo[indiceAtual + 1];
    return { moduloId: moduloIdAtual, aulaId: proxima.id };
  }

  const modulos = await listarModulos(cursoId);
  const indiceModuloAtual = modulos.findIndex((m) => m.id === moduloIdAtual);

  if (indiceModuloAtual === -1 || indiceModuloAtual + 1 >= modulos.length) {
    return null;
  }

  const proximoModulo = modulos[indiceModuloAtual + 1];
  const aulasDoProximoModulo = await listarAulas(cursoId, proximoModulo.id);

  if (aulasDoProximoModulo.length === 0) return null;

  return { moduloId: proximoModulo.id, aulaId: aulasDoProximoModulo[0].id };
}
