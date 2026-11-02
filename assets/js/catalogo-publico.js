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
  const snapshot = await getDocs(collection(db, 'catalogo_publico'));
  const registros = new Map(snapshot.docs.map(d => [d.id, d.data()]));
  const visivel = (id, d) => {
    if (d?.excluido === true || d?.ativo === false) return false;
    return d ? d.publicado === true : legados.has(id);
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
      const card = document.createElement('div'); card.className = 'card course-card'; card.dataset.cursoId = id;
      const icone = document.createElement('div'); icone.className = 'card-icon'; icone.setAttribute('aria-hidden', 'true');
      icone.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L14.5 9.5 L21 12 L14.5 14.5 L12 21 L9.5 14.5 L3 12 L9.5 9.5 Z"/></svg>';
      const h = document.createElement('h3'); h.textContent = titulo;
      const p = document.createElement('p'); p.textContent = texto(d.descricao) || 'Curso prático da CriativaMente Academy.';
      card.append(icone,h,p);
      if (id === 'inteligencia-artificial-e-produtividade' || /inteligência artificial e produtividade/i.test(titulo)) {
        h.textContent = 'Inteligência Artificial e Produtividade';
        p.textContent = 'Aprenda a aplicar inteligência artificial no trabalho, organizar tarefas e construir processos mais eficientes com atividades práticas.';
        const ul = document.createElement('ul');
        for (const item of ['Uso prático de inteligência artificial','Organização de tarefas e processos','Aplicação no trabalho e nos projetos']) {
          const li = document.createElement('li');
          li.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5 L10.5 15 L16 9"/></svg>';
          li.append(document.createTextNode(item)); ul.append(li);
        }
        card.append(ul);
      }
      const a = document.createElement('a'); a.href = url; a.className = 'btn btn-primary'; a.textContent = 'Saiba mais';
      card.append(a); container.append(card);
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
  console.error('Falha na leitura pública do Firestore:', erro);
  if (container) {
    container.replaceChildren();
    const aviso = document.createElement('p');
    aviso.setAttribute('role', 'alert');
    aviso.textContent = 'Catálogo temporariamente indisponível. Diagnóstico: ' + (erro.code || erro.message || 'falha desconhecida') + '.';
    container.append(aviso);
  }
  if (tabela) tabela.replaceChildren();
}
