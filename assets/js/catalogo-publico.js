// Catálogo público: somente cursos explicitamente publicados no Firestore.
// Regras Firestore precisam permitir leitura pública apenas dos metadados de cursos.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const app = initializeApp({"apiKey":"AIzaSyAoKHp6riW1htvqBXRU0YBSGkajErqdeJw","authDomain":"criativamente-academy.firebaseapp.com","projectId":"criativamente-academy","appId":"1:518569829764:web:d344c9df13f5c877a6e9d1"});
const db = getFirestore(app);
const container = document.querySelector('[data-catalogo-cursos]');
const tabela = document.querySelector('[data-resultados-cursos]');
const permitidos = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function texto(valor) { return typeof valor === 'string' ? valor.trim() : ''; }
function renderizar(cursos) {
  if (container) {
    container.replaceChildren();
    for (const curso of cursos) {
      const card = document.createElement('div'); card.className = 'card course-card';
      const titulo = document.createElement('h3'); titulo.textContent = curso.titulo;
      const descricao = document.createElement('p'); descricao.textContent = curso.descricao || 'Curso prático da CriativaMente Academy.';
      const link = document.createElement('a'); link.className = 'btn btn-primary'; link.href = curso.url; link.textContent = 'Saiba mais';
      card.append(titulo, descricao, link); container.append(card);
    }
    if (!cursos.length) { const p = document.createElement('p'); p.textContent = 'Nenhum curso publicado no momento.'; container.append(p); }
  }
  if (tabela) {
    tabela.replaceChildren();
    for (const curso of cursos) {
      const tr = document.createElement('tr'); const a = document.createElement('td'); const b = document.createElement('td');
      a.textContent = curso.titulo; b.textContent = curso.resultado || curso.descricao || 'Resultado prático ao concluir o curso.';
      tr.append(a,b); tabela.append(tr);
    }
  }
}
renderizar([]);
try {
  const docs = await getDocs(collection(db, 'cursos'));
  const cursos = docs.docs.flatMap(doc => {
    const d = doc.data();
    if (d.publicado !== true || d.ativo === false || !permitidos.test(doc.id)) return [];
    const titulo = texto(d.titulo || d.nome);
    if (!titulo) return [];
    const caminho = texto(d.paginaVendas);
    const url = caminho && /^\/[a-z0-9-]+\.html$/.test(caminho) ? caminho : '/' + doc.id + '.html';
    return [{ titulo, descricao: texto(d.descricao), resultado: texto(d.resultado), url }];
  }).sort((a,b)=>a.titulo.localeCompare(b.titulo,'pt-BR'));
  renderizar(cursos);
} catch (e) { console.error('Catálogo indisponível:', e); }
