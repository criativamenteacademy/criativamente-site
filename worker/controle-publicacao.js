// Validação na borda antes de servir páginas comerciais.
const paginas = new Map([
  ['/posicionamento-estrategico.html', 'posicionamento-estrategico'],
  ['/patrimonio-protegido.html', 'patrimonio-protegido']
]);
const antigos = new Set(paginas.values());
const html = (status, titulo, mensagem) => new Response(
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+titulo+' | CriativaMente Academy</title></head><body style="font:18px Arial,sans-serif;max-width:700px;margin:15vh auto;padding:24px;text-align:center"><h1>'+titulo+'</h1><p>'+mensagem+'</p><a href="/cursos.html">Ver outros cursos</a></body></html>',
  {status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}}
);
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = paginas.get(url.pathname);
    if (!id) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido', {status:405,headers:{allow:'GET, HEAD'}});
    try {
      const endpoint = 'https://firestore.googleapis.com/v1/projects/criativamente-academy/databases/(default)/documents/catalogo_publico/' + encodeURIComponent(id);
      const resposta = await fetch(endpoint, {headers:{accept:'application/json'},cf:{cacheTtl:0}});
      if (resposta.status === 404 && antigos.has(id)) {
        // Compatibilidade: cursos antigos sem registro público explícito.
        return semCache(await env.ASSETS.fetch(request));
      }
      if (!resposta.ok) return html(503,'Página temporariamente indisponível','Não foi possível confirmar a disponibilidade deste curso.');
      const doc = await resposta.json();
      const campos = doc.fields || {};
      if (campos.publicado?.booleanValue !== true || campos.excluido?.booleanValue === true || campos.ativo?.booleanValue === false) {
        return html(404,'Curso indisponível','Este curso não está disponível para novas inscrições no momento.');
      }
      return semCache(await env.ASSETS.fetch(request));
    } catch (erro) {
      console.error('Erro na validação de publicação', erro);
      return html(503,'Página temporariamente indisponível','Não foi possível confirmar a disponibilidade deste curso.');
    }
  }
};
function semCache(resposta) {
  const headers = new Headers(resposta.headers);
  headers.set('cache-control','no-store');
  return new Response(resposta.body,{status:resposta.status,statusText:resposta.statusText,headers});
}
