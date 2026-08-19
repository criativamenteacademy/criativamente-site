// assets/js/access-control.js
// ============================================================
// CONTROLE DE ACESSO A CURSOS — CriativaMente Academy
// ============================================================
// Lê a coleção "matriculas" (separada de "usuarios") para saber quais
// cursos cada aluno pode ver, e busca os metadados de cursos/módulos/
// aulas no catálogo público. NUNCA lê o campo "conteudo" de uma aula
// diretamente — isso é feito exclusivamente por content-loader.js,
// que aplica as 3 validações de segurança antes de buscar o conteúdo.
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

/**
 * Busca todas as matrículas ATIVAS (liberado === true) de um aluno.
 * A consulta já filtra por uid == aluno logado, o que é exigido pelas
 * regras do Firestore para autorizar a listagem.
 */
export async function listarMatriculasDoAluno(uid) {
  const referenciaColecao = collection(db, "matriculas");
  const consulta = query(
    referenciaColecao,
    where("uid", "==", uid),
    where("liberado", "==", true)
  );
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map((d) => d.data());
}

/**
 * Verifica se um aluno tem um curso específico liberado.
 * Usado como checagem rápida de UI (a checagem que realmente protege
 * o conteúdo acontece nas regras do Firestore + content-loader.js).
 */
export async function cursoLiberado(uid, cursoId) {
  const referencia = doc(db, "matriculas", `${uid}_${cursoId}`);
  const snapshot = await getDoc(referencia);
  return snapshot.exists() && snapshot.data().liberado === true;
}

/**
 * Busca os metadados públicos de um curso (nome, descrição, capa).
 * NUNCA contém o conteúdo das aulas.
 */
export async function buscarCurso(cursoId) {
  const referencia = doc(db, "cursos", cursoId);
  const snapshot = await getDoc(referencia);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Lista os cursos que o aluno tem liberados, já combinando os dados
 * do catálogo com o registro de matrícula. Pronta para o painel.
 */
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

/**
 * Lista os módulos de um curso (só títulos/ordem, nunca conteúdo de aula).
 */
export async function listarModulos(cursoId) {
  const referencia = collection(db, "cursos", cursoId, "modulos");
  const snapshot = await getDocs(referencia);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

/**
 * Lista as aulas de um módulo (só títulos/ordem/duração — nunca o
 * campo "conteudo"). Se o aluno não tiver o curso liberado, as regras
 * do Firestore já bloqueiam esta leitura.
 */
export async function listarAulas(cursoId, moduloId) {
  const referencia = collection(db, "cursos", cursoId, "modulos", moduloId, "aulas");
  const snapshot = await getDocs(referencia);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

/**
 * Retorna { moduloId, aulaId } da primeira aula do curso — usado
 * quando o aluno clica em "Começar curso" e ainda não tem progresso
 * registrado.
 */
export async function primeiraAula(cursoId) {
  const modulos = await listarModulos(cursoId);
  if (modulos.length === 0) return null;

  const aulas = await listarAulas(cursoId, modulos[0].id);
  if (aulas.length === 0) return null;

  return { moduloId: modulos[0].id, aulaId: aulas[0].id };
}
