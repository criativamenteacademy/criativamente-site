import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const app = initializeApp({"apiKey":"AIzaSyAoKHp6riW1htvqBXRU0YBSGkajErqdeJw","authDomain":"criativamente-academy.firebaseapp.com","projectId":"criativamente-academy","appId":"1:518569829764:web:d344c9df13f5c877a6e9d1"});
const db = getFirestore(app);
const id = document.documentElement.dataset.cursoId;
const legado = new Set(['posicionamento-estrategico','patrimonio-protegido']);
const bloquear = () => {
  document.documentElement.classList.add('publicacao-verificada');
  document.body.replaceChildren();
  const aviso = document.createElement('main');
  aviso.style.cssText = 'max-width:700px;margin:15vh auto;padding:32px;font:18px Arial,sans-serif;text-align:center';
  const h = document.createElement('h1'); h.textContent = 'Curso indisponível';
  const p = document.createElement('p'); p.textContent = 'Este curso não está disponível para novas inscrições no momento.';
  const a = document.createElement('a'); a.href = '/cursos.html'; a.textContent = 'Ver outros cursos';
  aviso.append(h,p,a); document.body.append(aviso);
};
try {
  const snap = await getDoc(doc(db,'catalogo_publico',id));
  const d = snap.exists() ? snap.data() : null;
  if (d ? d.publicado !== true || d.excluido === true : !legado.has(id)) bloquear();
  else document.documentElement.classList.add('publicacao-verificada');
} catch (erro) {
  console.error('Falha ao verificar publicação:', erro);
  bloquear();
}
