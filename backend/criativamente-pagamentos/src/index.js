var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CURSOS = {
  "posicionamento-estrategico": {
    valor: 397,
    descricao: "Posicionamento Estrat\xE9gico \u2014 CriativaMente Academy"
  }
};
var ORIGENS_PERMITIDAS = /* @__PURE__ */ new Set([
  "https://criativamenteacademy.com",
  "https://www.criativamenteacademy.com"
]);
var index_default = {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = construirCorsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    try {
      if (url.pathname === "/criar-cobranca" && request.method === "POST") {
        return await criarCobranca(request, env, corsHeaders);
      }
      if (url.pathname === "/webhook-asaas" && request.method === "POST") {
        return await receberWebhook(request, env);
      }
      return jsonResponse({ erro: "Rota n\xE3o encontrada." }, 404, corsHeaders);
    } catch (erro) {
      console.error("Erro n\xE3o tratado:", erro);
      return jsonResponse(
        { erro: "Erro interno. Tente novamente em instantes." },
        500,
        corsHeaders
      );
    }
  }
};
function construirCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (ORIGENS_PERMITIDAS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
__name(construirCorsHeaders, "construirCorsHeaders");
function jsonResponse(dados, status, corsHeaders) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
function baseUrlAsaas(env) {
  return env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}
__name(baseUrlAsaas, "baseUrlAsaas");
function limparCpf(cpf) {
  return (cpf || "").replace(/\D/g, "");
}
__name(limparCpf, "limparCpf");
function limparCep(cep) {
  return (cep || "").replace(/\D/g, "");
}
__name(limparCep, "limparCep");
async function criarCobranca(request, env, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ erro: "Corpo da requisi\xE7\xE3o inv\xE1lido." }, 400, corsHeaders);
  }
  const { uid, nome, email, cpf, telefone, cursoId, endereco } = body;
  const curso = CURSOS[cursoId];
  if (!uid || !nome || !email || !cpf || !cursoId) {
    return jsonResponse(
      { erro: "Preencha nome, e-mail e CPF para continuar." },
      400,
      corsHeaders
    );
  }
  if (!endereco || !endereco.cep || !endereco.endereco || !endereco.numero || !endereco.cidade || !endereco.estado) {
    return jsonResponse(
      { erro: "Preencha o endere\xE7o completo para continuar." },
      400,
      corsHeaders
    );
  }
  if (!curso) {
    return jsonResponse({ erro: "Curso n\xE3o encontrado." }, 404, corsHeaders);
  }
  const cpfLimpo = limparCpf(cpf);
  const headersAsaas = {
    "Content-Type": "application/json",
    "User-Agent": "CriativaMenteAcademy/1.0",
    access_token: env.ASAAS_API_KEY
  };

  const buscaResp = await fetch(
    `${baseUrlAsaas(env)}/customers?cpfCnpj=${cpfLimpo}`,
    { headers: headersAsaas }
  );
  const busca = await buscaResp.json();
  let customerId = busca?.data?.[0]?.id;

  const dadosCliente = {
    name: nome,
    email,
    cpfCnpj: cpfLimpo,
    phone: telefone || void 0,
    externalReference: uid,
    postalCode: limparCep(endereco.cep),
    address: endereco.endereco,
    addressNumber: endereco.numero,
    complement: endereco.complemento || void 0,
    province: endereco.bairro
  };

  if (!customerId) {
    const criaResp = await fetch(`${baseUrlAsaas(env)}/customers`, {
      method: "POST",
      headers: headersAsaas,
      body: JSON.stringify(dadosCliente)
    });
    const criado = await criaResp.json();
    if (!criaResp.ok) {
      console.error("Erro ao criar cliente Asaas:", criado);
      return jsonResponse(
        { erro: "N\xE3o foi poss\xEDvel processar seus dados. Confira o CPF e tente novamente." },
        400,
        corsHeaders
      );
    }
    customerId = criado.id;
  } else {
    const atualizaResp = await fetch(`${baseUrlAsaas(env)}/customers/${customerId}`, {
      method: "POST",
      headers: headersAsaas,
      body: JSON.stringify(dadosCliente)
    });
    if (!atualizaResp.ok) {
      const erroAtualiza = await atualizaResp.json();
      console.error("Erro ao atualizar endere\xE7o do cliente Asaas:", erroAtualiza);
    }
  }

  const vencimento = /* @__PURE__ */ new Date();
  vencimento.setDate(vencimento.getDate() + 3);
  const dueDate = vencimento.toISOString().slice(0, 10);
  const origin = request.headers.get("Origin") || "https://criativamenteacademy.com";
  const pagamentoResp = await fetch(`${baseUrlAsaas(env)}/payments`, {
    method: "POST",
    headers: headersAsaas,
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value: curso.valor,
      dueDate,
      description: curso.descricao,
      externalReference: `${uid}__${cursoId}`,
      callback: {
        successUrl: `${origin}/area-do-aluno.html`,
        autoRedirect: true
      }
    })
  });
  const pagamento = await pagamentoResp.json();
  if (!pagamentoResp.ok) {
    console.error("Erro ao criar cobran\xE7a Asaas:", pagamento);
    return jsonResponse(
      { erro: "N\xE3o foi poss\xEDvel gerar a cobran\xE7a. Tente novamente." },
      400,
      corsHeaders
    );
  }
  try {
    const accessToken = await obterTokenGoogle(env);
    await firestoreEscrever({
      projectId: env.FIREBASE_PROJECT_ID,
      accessToken,
      caminho: `pedidos/${pagamento.id}`,
      dados: {
        uid,
        cursoId,
        nome,
        email,
        cpf: cpfLimpo,
        telefone,
        endereco,
        valor: curso.valor,
        status: "pendente",
        criadoEm: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (erro) {
    console.error("Falha ao salvar registro do pedido (n\xE3o bloqueante):", erro);
  }
  return jsonResponse({ invoiceUrl: pagamento.invoiceUrl }, 200, corsHeaders);
}
__name(criarCobranca, "criarCobranca");
async function receberWebhook(request, env) {
  const tokenRecebido = request.headers.get("asaas-access-token");
  if (tokenRecebido !== env.ASAAS_WEBHOOK_TOKEN) {
    console.error("Webhook recebido com token inv\xE1lido.");
    return new Response("N\xE3o autorizado.", { status: 401 });
  }
  const evento = await request.json().catch(() => null);
  if (!evento) {
    return new Response("Corpo inv\xE1lido.", { status: 400 });
  }
  const eventosQueLiberamAcesso = /* @__PURE__ */ new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
  if (!eventosQueLiberamAcesso.has(evento.event)) {
    return new Response("Evento ignorado (n\xE3o libera acesso).", { status: 200 });
  }
  const referencia = evento?.payment?.externalReference || "";
  const [uid, cursoId] = referencia.split("__");
  const paymentId = evento?.payment?.id;
  if (!uid || !cursoId) {
    console.error("externalReference sem uid/cursoId:", referencia);
    return new Response("Refer\xEAncia inv\xE1lida.", { status: 200 });
  }
  const accessToken = await obterTokenGoogle(env);
  const pedido = await firestoreLer({
    projectId: env.FIREBASE_PROJECT_ID,
    accessToken,
    caminho: `pedidos/${paymentId}`
  });
  await firestoreEscrever({
    projectId: env.FIREBASE_PROJECT_ID,
    accessToken,
    caminho: `matricula/${uid}_${cursoId}`,
    dados: {
      uid,
      cursoId,
      liberado: true,
      origem: "asaas",
      formaPagamento: evento.payment.billingType,
      valor: evento.payment.value,
      asaasPaymentId: paymentId,
      liberadoEm: (/* @__PURE__ */ new Date()).toISOString(),
      nome: pedido?.nome || null,
      telefone: pedido?.telefone || null,
      endereco: pedido?.endereco || null
    }
  });
  if (pedido) {
    await firestoreEscrever({
      projectId: env.FIREBASE_PROJECT_ID,
      accessToken,
      caminho: `pedidos/${paymentId}`,
      dados: { ...pedido, status: "pago" }
    }).catch((e) => console.error("Falha ao marcar pedido como pago:", e));
  }
  return new Response("Matr\xEDcula liberada com sucesso.", { status: 200 });
}
__name(receberWebhook, "receberWebhook");
async function obterTokenGoogle(env) {
  const credencial = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const agora = Math.floor(Date.now() / 1e3);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credencial.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: agora,
    exp: agora + 3600
  };
  const jwt = await assinarJwt(header, payload, credencial.private_key);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const dados = await resp.json();
  if (!resp.ok) {
    console.error("Erro ao obter token do Google:", dados);
    throw new Error("Falha na autentica\xE7\xE3o com o Firebase.");
  }
  return dados.access_token;
}
__name(obterTokenGoogle, "obterTokenGoogle");
async function assinarJwt(header, payload, chavePrivadaPem) {
  const codificar = /* @__PURE__ */ __name((obj) => base64UrlFromBytes(new TextEncoder().encode(JSON.stringify(obj))), "codificar");
  const naoAssinado = `${codificar(header)}.${codificar(payload)}`;
  const chave = await importarChavePrivada(chavePrivadaPem);
  const assinatura = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    chave,
    new TextEncoder().encode(naoAssinado)
  );
  return `${naoAssinado}.${base64UrlFromBytes(new Uint8Array(assinatura))}`;
}
__name(assinarJwt, "assinarJwt");
async function importarChavePrivada(pem) {
  const corpo = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const bytes = Uint8Array.from(atob(corpo), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
__name(importarChavePrivada, "importarChavePrivada");
function base64UrlFromBytes(bytes) {
  let binario = "";
  bytes.forEach((b) => binario += String.fromCharCode(b));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlFromBytes, "base64UrlFromBytes");
function paraValorFirestore(valor) {
  if (valor === null || valor === void 0) return { nullValue: null };
  if (typeof valor === "boolean") return { booleanValue: valor };
  if (typeof valor === "number") return { doubleValue: valor };
  if (typeof valor === "string") return { stringValue: valor };
  if (Array.isArray(valor)) {
    return { arrayValue: { values: valor.map(paraValorFirestore) } };
  }
  if (typeof valor === "object") {
    const fields = {};
    for (const chave in valor) {
      fields[chave] = paraValorFirestore(valor[chave]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(valor) };
}
__name(paraValorFirestore, "paraValorFirestore");
function deValorFirestore(valorFirestore) {
  if (!valorFirestore) return null;
  if ("nullValue" in valorFirestore) return null;
  if ("booleanValue" in valorFirestore) return valorFirestore.booleanValue;
  if ("doubleValue" in valorFirestore) return valorFirestore.doubleValue;
  if ("integerValue" in valorFirestore) return Number(valorFirestore.integerValue);
  if ("stringValue" in valorFirestore) return valorFirestore.stringValue;
  if ("timestampValue" in valorFirestore) return valorFirestore.timestampValue;
  if ("arrayValue" in valorFirestore) {
    return (valorFirestore.arrayValue.values || []).map(deValorFirestore);
  }
  if ("mapValue" in valorFirestore) {
    const obj = {};
    const campos = valorFirestore.mapValue.fields || {};
    for (const chave in campos) {
      obj[chave] = deValorFirestore(campos[chave]);
    }
    return obj;
  }
  return null;
}
__name(deValorFirestore, "deValorFirestore");
async function firestoreEscrever({ projectId, accessToken, caminho, dados }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${caminho}`;
  const fields = {};
  for (const chave in dados) {
    fields[chave] = paraValorFirestore(dados[chave]);
  }
  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
  if (!resp.ok) {
    const erro = await resp.text();
    console.error(`Erro ao escrever em ${caminho}:`, erro);
    throw new Error("Falha ao gravar no Firestore.");
  }
  return resp.json();
}
__name(firestoreEscrever, "firestoreEscrever");
async function firestoreLer({ projectId, accessToken, caminho }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${caminho}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const erro = await resp.text();
    console.error(`Erro ao ler ${caminho}:`, erro);
    return null;
  }
  const documento = await resp.json();
  const dados = {};
  const campos = documento.fields || {};
  for (const chave in campos) {
    dados[chave] = deValorFirestore(campos[chave]);
  }
  return dados;
}
__name(firestoreLer, "firestoreLer");
export {
  index_default as default
};
