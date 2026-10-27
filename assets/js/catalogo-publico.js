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
// Os dois cursos anteriores à integração começam publicados.
// Uma ação explícita no painel passa a controlar sua visibilidade.
const legados = new Set(['posicionamento-estrategico', 'patrimonio-protegido']);
try {
  const snapshot = await getDocs(collection(db, 'cursos'));
  const registros = new Map(snapshot.docs.map(d => [d.id, d.data()]));
  const visivel = (id, d) => {
    if (d?.excluido === true || d?.ativo === false) return false;
    if (d?.visibilidadeGerenciada === true) return d.publicado === true;
    return legados.has(id);
  };
  if (container) {
    for (const card of [...container.querySelectorAll('.course-card')]) {
      const id = (card.querySelector('a[href]')?.getAttribute('href') || '').split('/').pop().split('.html')[0];
      if (!visivel(id, registros.get(id))) card.remove();
    }
    for (const doc of snapshot.docs) {
      const d = doc.data(), id = doc.id;
      if (!permitidos.test(id) || !visivel(id, d)) continue;
      if ([...container.querySelectorAll('a[href]')].some(a => a.getAttribute('href')?.split('/').pop() === id + '.html')) continue;
      const titulo = texto(d.titulo || d.nome);
      if (!titulo) continue;
      const caminho = texto(d.paginaVendas);
      const url = caminho.startsWith('/') && caminho.endsWith('.html') && !caminho.includes('..') ? caminho : '/' + id + '.html';
      const card = document.createElement('div'); card.className = 'card course-card';
      const h = document.createElement('h3'); h.textContent = titulo;
      const p = document.createElement('p'); p.textContent = texto(d.descricao) || 'Curso prático da CriativaMente Academy.';
      const a = document.createElement('a'); a.href = url; a.className = 'btn btn-primary'; a.textContent = 'Saiba mais';
      card.append(h,p,a); container.append(card);
    }
  }
  if (tabela) {
    for (const tr of [...tabela.querySelectorAll('tr')]) {
      const titulo = tr.querySelector('td')?.textContent?.trim();
      const id = titulo === 'Posicionamento Estratégico' ? 'posicionamento-estrategico' : titulo === 'Patrimônio Protegido' ? 'patrimonio-protegido' : null;
      if (id && !visivel(id, registros.get(id))) tr.remove();
    }
  }
} catch (erro) {
  console.error('Não foi possível atualizar o catálogo; exibindo cursos estáticos existentes.', erro);
}
