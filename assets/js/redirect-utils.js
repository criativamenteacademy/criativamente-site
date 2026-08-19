// assets/js/redirect-utils.js
// ============================================================
// Função isolada em arquivo próprio de propósito: login.html
// precisa dela, mas NÃO pode importar auth-guard.js diretamente,
// porque esse arquivo já dispara sozinho, ao ser importado, a
// lógica de proteção de página (onAuthStateChanged) — o que causaria
// um redirecionamento indevido na própria tela de login.
// ============================================================

/**
 * Só aceita redirecionar para páginas do PRÓPRIO site.
 * Bloqueia qualquer tentativa de redirecionamento aberto:
 *  - precisa começar com "/"
 *  - não pode começar com "//" (o navegador trataria como domínio externo)
 *  - não pode conter "://" (URL absoluta para outro site)
 */
export function sanitizarRedirect(valor, padrao = "/area-do-aluno.html") {
  if (typeof valor !== "string" || valor.length === 0) return padrao;
  if (!valor.startsWith("/")) return padrao;
  if (valor.startsWith("//")) return padrao;
  if (valor.includes("://")) return padrao;
  return valor;
}
