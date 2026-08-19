// assets/js/protecao-conteudo.js
// ============================================================
// PROTEÇÃO DE CONTEÚDO — CriativaMente Academy
// ============================================================
// Aplica, na página da aula, as barreiras combinadas contra cópia
// e replicação do conteúdo:
//   1) bloqueia seleção de texto na área da aula
//   2) bloqueia copiar/colar e menu do botão direito
//   3) bloqueia atalhos comuns (Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, F12)
//   4) esconde o conteúdo na impressão (CSS @media print)
//   5) aplica marca d'água individual (nome/e-mail do aluno) sobre
//      a aula, repetida e discreta
//
// IMPORTANTE — isto NUNCA é 100% à prova de cópia. Ninguém
// consegue bloquear print de tela do sistema operacional, foto de
// câmera externa, ou alguém decidido a reescrever o conteúdo com
// as próprias palavras. O objetivo aqui é DESESTIMULAR e, no caso
// da marca d'água, permitir IDENTIFICAR a origem de um vazamento.
//
// Uso: chame ativarProtecaoConteudo(elementoDaAula, usuario) depois
// que a aula terminar de carregar em aula.html.
// ============================================================

export function ativarProtecaoConteudo(elementoConteudo, usuario) {
  if (!elementoConteudo) return;

  // 1) Bloquear seleção de texto (visual — CSS) -----------------
  elementoConteudo.classList.add("cm-protegido");

  // 2) Bloquear copiar/colar e menu do botão direito ------------
  const bloquear = (evento) => evento.preventDefault();
  elementoConteudo.addEventListener("copy", bloquear);
  elementoConteudo.addEventListener("cut", bloquear);
  elementoConteudo.addEventListener("paste", bloquear);
  elementoConteudo.addEventListener("contextmenu", bloquear);
  elementoConteudo.addEventListener("dragstart", bloquear);

  // 3) Bloquear atalhos comuns do teclado ------------------------
  document.addEventListener("keydown", (evento) => {
    const tecla = evento.key ? evento.key.toLowerCase() : "";
    const combinacaoBloqueada =
      (evento.ctrlKey || evento.metaKey) &&
      ["c", "u", "s", "p", "x"].includes(tecla);

    if (combinacaoBloqueada || evento.key === "F12") {
      evento.preventDefault();
    }
  });

  // 5) Marca d'água individual ------------------------------------
  inserirMarcaDagua(elementoConteudo, usuario);
}

function inserirMarcaDagua(elementoConteudo, usuario) {
  const identificacao = (usuario && (usuario.email || usuario.uid)) || "aluno";

  const camada = document.createElement("div");
  camada.className = "cm-marca-dagua";
  camada.setAttribute("aria-hidden", "true");

  // Repete a marca várias vezes pela área da aula, em posições
  // levemente diferentes, para dificultar recortar a marca fora
  // de um print de tela.
  const linhas = 14;
  let html = "";
  for (let i = 0; i < linhas; i++) {
    html += `<span>${identificacao}</span>`;
  }
  camada.innerHTML = html;

  // Precisa que o elemento pai tenha position relative para a
  // marca d'água (position absolute) se posicionar corretamente.
  const pai = elementoConteudo.parentElement || elementoConteudo;
  const posicaoAtual = window.getComputedStyle(pai).position;
  if (posicaoAtual === "static") {
    pai.style.position = "relative";
  }
  pai.appendChild(camada);
}
