# criativamente-pagamentos

Cloudflare Worker que serve de ponte segura entre o site da CriativaMente
Academy e a API da Asaas — mantém as chaves secretas fora do código do
frontend (checkout.html).

URL em produção: `https://criativamente-pagamentos.contatojhonisilva.workers.dev`

## Rotas

- **`POST /criar-cobranca`** — chamada pelo `checkout.html` do site.
  Recebe nome, e-mail, CPF, telefone, endereço completo e o curso escolhido.
  Cria (ou atualiza, se já existir) o cliente na Asaas com o endereço
  completo, gera a cobrança e retorna `{ invoiceUrl }` pro checkout
  redirecionar o aluno.

- **`POST /webhook-asaas`** — chamada pela própria Asaas quando um
  pagamento é confirmado. Valida o token do webhook, libera o acesso do
  aluno gravando `matricula/{uid}_{cursoId}` no Firestore com
  `liberado: true`.

## Cursos configurados

Editar o objeto `CURSOS` no topo de `src/index.js` pra adicionar/mudar
preço de cursos vendidos por este checkout:

```js
var CURSOS = {
  "posicionamento-estrategico": { valor: 397, descricao: "..." }
};
```

## Segredos necessários (nunca commitados neste repositório)

Configurar via `wrangler secret put NOME_DO_SEGREDO` ou pelo painel da
Cloudflare (Workers & Pages → criativamente-pagamentos → Configurações →
Variáveis e Segredos):

| Segredo | O que é |
|---|---|
| `ASAAS_API_KEY` | Chave de API da Asaas (produção, começa com `$aact_prod_`) |
| `ASAAS_WEBHOOK_TOKEN` | Token de autenticação do webhook, configurado também no painel da Asaas |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo da conta de serviço do Firebase (gerado no console do Firebase → Configurações do projeto → Contas de serviço) |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase (`criativamente-academy`) |

A variável `ASAAS_ENV` (produção/sandbox) fica em `wrangler.toml`, não é
segredo.

## Deploy

```bash
npm install
npx wrangler deploy
```

Requer login prévio via `npx wrangler login`, ou as variáveis de ambiente
`CLOUDFLARE_API_KEY` e `CLOUDFLARE_EMAIL` configuradas (útil em ambientes
como GitHub Codespaces, onde o login via navegador não funciona).

## Webhook na Asaas

Configurado em Integrações → Webhooks, apontando para
`/webhook-asaas` desta URL, escutando os eventos:

- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`

## Histórico

Este código foi reconstruído em 26/08/2026 a partir do histórico de
conversas, pois o Worker original foi implantado direto via Wrangler CLI
sem repositório Git — este repo existe justamente para que isso não
aconteça de novo. Testado ponta a ponta em sandbox: checkout → cliente
criado na Asaas com endereço completo → cobrança gerada → pagamento
confirmado → webhook recebido → matrícula liberada no Firestore.
