// assets/js/content-loader.js
// ============================================================
// CARREGADOR DE CONTEÚDO PROTEGIDO — CriativaMente Academy
// ============================================================
// ÚNICO lugar do sistema autorizado a buscar o campo "conteudo" de
// uma aula. Antes de qualquer leitura, valida NESTA ORDEM:
//
//   1) o aluno está autenticado E com e-mail verificado
//   2) a conta dele está com status "ativa"
//   3) o curso desta aula está liberado para ele (matriculas)
//
// Só depois das 3 validações passarem é que o Firestore é consultado
// para trazer o conteúdo real da aula. As mesmas 3 regras também
// estão reforçadas em firestore.rules — este arquivo é a camada de
// experiência (mensagens de erro amigáveis), a regra do Firestore é
// a camada que realmente impede o acesso mesmo que alguém tente
// pular este arquivo e chamar o Firestore diretamente.
// ============================================================

import { auth, db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const ERROS = {
  NAO_AUTENTICADO: "NAO_AUTENTICADO",
  EMAIL_NAO_VERIFICADO: "EMAIL_NAO_VERIFICADO",
  CONTA_INATIVA: "CONTA_INATIVA",
  CURSO_NAO_LIBERADO: "CURSO_NAO_LIBERADO",
  CONTEUDO_NAO_ENCONTRADO: "CONTEUDO_NAO_ENCONTRADO"
};

function erro(codigo, mensagem) {
  const e = new Error(mensagem);
  e.codigo = codigo;
  return e;
}

/**
 * Carrega o conteúdo completo de uma aula, validando autenticação,
 * status da conta e matrícula liberada antes de qualquer leitura.
 *
 * @param {string} cursoId
 * @param {string} moduloId
 * @param {string} aulaId
 * @returns {Promise<object>} dados da aula, incluindo "conteudo"
 */
export async function carregarAula(cursoId, moduloId, aulaId) {
  // 1) autenticado + e-mail verificado
  const usuario = auth.currentUser;
  if (!usuario) {
    throw erro(ERROS.NAO_AUTENTICADO, "Você precisa estar logado para ver esta aula.");
  }
  if (!usuario.emailVerified) {
    throw erro(ERROS.EMAIL_NAO_VERIFICADO, "Confirme seu e-mail para acessar o conteúdo das aulas.");
  }

  // 2) conta ativa
  const docUsuario = await getDoc(doc(db, "usuarios", usuario.uid));
  if (!docUsuario.exists() || docUsuario.data().status !== "ativa") {
    throw erro(ERROS.CONTA_INATIVA, "Sua conta não está ativa no momento.");
  }

  // 3) curso liberado para este aluno
  const idMatricula = `${usuario.uid}_${cursoId}`;
  const docMatricula = await getDoc(doc(db, "matricula", idMatricula));
  if (!docMatricula.exists() || docMatricula.data().liberado !== true) {
    throw erro(ERROS.CURSO_NAO_LIBERADO, "Você ainda não tem acesso a este curso.");
  }

  // Só agora o conteúdo real é buscado.
  const referenciaAula = doc(db, "cursos", cursoId, "modulos", moduloId, "aulas", aulaId);
  const docAula = await getDoc(referenciaAula);

  if (!docAula.exists()) {
    throw erro(ERROS.CONTEUDO_NAO_ENCONTRADO, "Esta aula não foi encontrada.");
  }

  return { id: docAula.id, ...docAula.data() };
}
