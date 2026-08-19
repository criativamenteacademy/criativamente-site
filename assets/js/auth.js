// assets/js/auth.js
// ============================================================
// AUTENTICAÇÃO — CriativaMente Academy
// Usado por cadastro.html, login.html e recuperar-senha.html
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Link para onde o Firebase manda o aluno depois de clicar no e-mail
// de verificação ou de redefinição de senha. acao.html trata os dois casos.
const URL_ACAO = `${window.location.origin}/acao.html`;

/**
 * Cadastra um novo aluno com e-mail e senha, cria o documento em
 * "usuarios" (SEM nenhum campo de curso liberado — isso agora vive
 * em "matriculas", editado só por você) e dispara o e-mail de
 * verificação.
 */
export async function cadastrarUsuario(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);

  await updateProfile(credencial.user, { displayName: nome });

  await setDoc(doc(db, "usuarios", credencial.user.uid), {
    nome,
    email,
    criadoEm: serverTimestamp(),
    status: "ativa",
    preferencias: {}
  });

  await sendEmailVerification(credencial.user, { url: URL_ACAO });

  return credencial.user;
}

/**
 * Login de um aluno já cadastrado.
 */
export async function entrarUsuario(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

/**
 * Logout.
 */
export async function sairUsuario() {
  await signOut(auth);
}

/**
 * Envia o e-mail de redefinição de senha.
 */
export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email, { url: URL_ACAO });
}

/**
 * Reenvia o e-mail de verificação para o usuário atualmente logado
 * (usado no banner "confirme seu e-mail" da área do aluno).
 */
export async function reenviarVerificacaoDeEmail() {
  if (!auth.currentUser) {
    throw new Error("Nenhum usuário logado.");
  }
  await sendEmailVerification(auth.currentUser, { url: URL_ACAO });
}

/**
 * Traduz códigos de erro do Firebase Auth para mensagens em
 * português, no tom direto do site.
 */
export function traduzirErroFirebase(codigo) {
  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Tente fazer login.",
    "auth/invalid-email": "Digite um e-mail válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
    "auth/expired-action-code": "Este link expirou. Solicite um novo.",
    "auth/invalid-action-code": "Este link já foi usado ou é inválido. Solicite um novo."
  };

  return mensagens[codigo] || "Não foi possível concluir. Tente novamente em instantes.";
}
