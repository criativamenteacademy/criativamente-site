// assets/js/mostrar-senha.js
// ============================================================
// Ativa o botão "olho" que mostra/oculta o texto digitado em
// campos de senha. Usado em login, cadastro e redefinição de
// senha — qualquer input dentro de um wrapper ".campo-senha"
// com um botão ".botao-mostrar-senha" ao lado é ativado.
//
// Uso: chame ativarBotoesMostrarSenha() uma vez, depois que a
// página carregar.
// ============================================================

const ICONE_OLHO_ABERTO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

const ICONE_OLHO_FECHADO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.22-5.2"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.51 18.51 0 0 1-2.16 3.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><path d="M1 1l22 22"/></svg>`;

export function ativarBotoesMostrarSenha() {
  document.querySelectorAll(".botao-mostrar-senha").forEach((botao) => {
    if (!botao.innerHTML.trim()) botao.innerHTML = ICONE_OLHO_ABERTO;

    botao.addEventListener("click", () => {
      const input = document.getElementById(botao.dataset.alvo);
      if (!input) return;

      const estaMostrando = input.type === "text";
      input.type = estaMostrando ? "password" : "text";
      botao.innerHTML = estaMostrando ? ICONE_OLHO_ABERTO : ICONE_OLHO_FECHADO;
      botao.setAttribute("aria-label", estaMostrando ? "Mostrar senha" : "Ocultar senha");

      // Mantém o foco e o cursor no campo depois de clicar no botão
      input.focus();
    });
  });
}
