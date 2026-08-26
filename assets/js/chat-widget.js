// assets/js/chat-widget.js
// ============================================================
// Widget de chat da CriativaMente Academy.
// Um único <script src="/assets/js/chat-widget.js" defer></script>
// é suficiente em qualquer página — este arquivo injeta seu
// próprio CSS e monta toda a interface sozinho.
//
// CONFIGURAÇÃO: depois que o fluxo estiver pronto no n8n, troque
// WEBHOOK_URL abaixo pela URL real gerada pelo nó Webhook.
// Enquanto WEBHOOK_URL estiver vazio, o widget já funciona: ele
// pula direto pra abrir o WhatsApp quando o visitante manda uma
// mensagem, sem tentar chamar um endereço que não existe.
// ============================================================

(function () {
  "use strict";

  const WEBHOOK_URL = ""; // Ex: "https://seu-n8n.onrender.com/webhook/chat-site"
  const WHATSAPP_NUMERO = "554391337845";
  const MENSAGEM_BOAS_VINDAS =
    "Oi! Sou o assistente virtual da CriativaMente Academy. Posso te ajudar com dúvidas sobre os cursos, preços ou como funciona. O que você quer saber?";

  function injetarCSS() {
    if (document.getElementById("cm-chat-widget-css")) return;
    const link = document.createElement("link");
    link.id = "cm-chat-widget-css";
    link.rel = "stylesheet";
    link.href = "/assets/css/chat-widget.css";
    document.head.appendChild(link);
  }

  function montarHTML() {
    const bolha = document.createElement("button");
    bolha.id = "cm-chat-bolha";
    bolha.type = "button";
    bolha.setAttribute("aria-label", "Abrir chat de atendimento");
    bolha.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    const janela = document.createElement("div");
    janela.id = "cm-chat-janela";
    janela.innerHTML = `
      <div class="cm-chat-cabecalho">
        <img src="/brand-mark.png" alt="" aria-hidden="true">
        <div class="cm-chat-cabecalho-texto">
          <p class="cm-chat-cabecalho-titulo">CriativaMente Academy</p>
          <p class="cm-chat-cabecalho-status">Online agora</p>
        </div>
        <button type="button" class="cm-chat-fechar" aria-label="Fechar chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="cm-chat-mensagens"></div>
      <form id="cm-chat-form">
        <input type="text" id="cm-chat-input" placeholder="Digite sua pergunta..." autocomplete="off">
        <button type="submit" id="cm-chat-enviar" aria-label="Enviar mensagem">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    `;

    document.body.appendChild(bolha);
    document.body.appendChild(janela);

    return { bolha, janela };
  }

  function linkWhatsApp(textoUsuario) {
    const mensagem = textoUsuario
      ? `Vim do chat do site. Minha dúvida era: ${textoUsuario}`
      : "Vim do chat do site e gostaria de falar com um atendente.";
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  }

  function iconeWhatsApp() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.18 8.18 0 0 1-1.26-4.35c0-4.53 3.69-8.22 8.23-8.22 4.53 0 8.22 3.69 8.22 8.22 0 4.54-3.69 8.19-8.23 8.19zm4.51-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>';
  }

  function criarMensagem(tipo, texto) {
    const div = document.createElement("div");
    div.className = "cm-msg cm-msg-" + tipo;
    div.textContent = texto;
    return div;
  }

  function criarBotaoWhatsApp(textoUsuario) {
    const a = document.createElement("a");
    a.className = "cm-msg-whatsapp";
    a.href = linkWhatsApp(textoUsuario);
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = iconeWhatsApp() + "<span>Falar no WhatsApp</span>";
    return a;
  }

  function iniciar() {
    injetarCSS();
    const { bolha, janela } = montarHTML();

    const mensagens = janela.querySelector("#cm-chat-mensagens");
    const form = janela.querySelector("#cm-chat-form");
    const input = janela.querySelector("#cm-chat-input");
    const botaoEnviar = janela.querySelector("#cm-chat-enviar");
    const botaoFechar = janela.querySelector(".cm-chat-fechar");

    let conversaIniciada = false;

    function abrir() {
      janela.classList.add("cm-aberta");
      if (!conversaIniciada) {
        mensagens.appendChild(criarMensagem("bot", MENSAGEM_BOAS_VINDAS));
        conversaIniciada = true;
      }
      input.focus();
    }

    function fechar() {
      janela.classList.remove("cm-aberta");
    }

    bolha.addEventListener("click", () => {
      if (janela.classList.contains("cm-aberta")) {
        fechar();
      } else {
        abrir();
      }
    });
    botaoFechar.addEventListener("click", fechar);

    function mostrarDigitando() {
      const div = document.createElement("div");
      div.className = "cm-msg-digitando";
      div.id = "cm-chat-digitando";
      div.innerHTML = "<span></span><span></span><span></span>";
      mensagens.appendChild(div);
      mensagens.scrollTop = mensagens.scrollHeight;
    }

    function removerDigitando() {
      const digitando = document.getElementById("cm-chat-digitando");
      if (digitando) digitando.remove();
    }

    async function enviarMensagem(texto) {
      mensagens.appendChild(criarMensagem("usuario", texto));
      mensagens.scrollTop = mensagens.scrollHeight;
      mostrarDigitando();

      if (!WEBHOOK_URL) {
        setTimeout(() => {
          removerDigitando();
          mensagens.appendChild(
            criarMensagem(
              "bot",
              "Nosso assistente automático ainda está sendo configurado. Fala direto comigo no WhatsApp que eu te ajudo agora:"
            )
          );
          mensagens.appendChild(criarBotaoWhatsApp(texto));
          mensagens.scrollTop = mensagens.scrollHeight;
        }, 500);
        return;
      }

      try {
        const resp = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagem: texto })
        });
        const dados = await resp.json();
        removerDigitando();

        if (dados.resposta) {
          mensagens.appendChild(criarMensagem("bot", dados.resposta));
        }
        if (dados.escalar) {
          mensagens.appendChild(
            criarBotaoWhatsApp(dados.whatsapp_mensagem || texto)
          );
        }
      } catch (erro) {
        removerDigitando();
        mensagens.appendChild(
          criarMensagem(
            "bot",
            "Não consegui me conectar agora. Fala direto comigo no WhatsApp:"
          )
        );
        mensagens.appendChild(criarBotaoWhatsApp(texto));
      }
      mensagens.scrollTop = mensagens.scrollHeight;
    }

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const texto = input.value.trim();
      if (!texto) return;
      input.value = "";
      botaoEnviar.disabled = true;
      enviarMensagem(texto).finally(() => {
        botaoEnviar.disabled = false;
        input.focus();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
