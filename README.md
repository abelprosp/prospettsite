# Prospétt Marketing

Site estático pré-renderizado em HTML semântico, CSS e JavaScript, sem dependências de execução. Todos os textos ficam disponíveis sem JavaScript. O logo original é preservado em `dist/logo.png`.

## Prévia

Execute `npm run dev` e abra http://127.0.0.1:4173. Validação de sintaxe: `npm run check`.

## Configuração antes de receber contatos

Edite `dist/config.js`: `formEndpoint` deve apontar para um endpoint HTTPS que aceite POST JSON com name, company, website, email, phone e objective. Respostas HTTP 2xx confirmam o recebimento; erros mantêm os dados digitados. O endpoint deve validar dados no servidor, aplicar proteção contra abuso e guardar segredos exclusivamente no servidor. Configure CORS se usar outro domínio. Não inclua tokens neste arquivo público.

Preencha `privacyContact`, revise a política de privacidade com os fornecedores e prazos efetivos e só então ative o endpoint. O formulário sem configuração informa indisponibilidade e nunca simula sucesso. WhatsApp é opcional: use 55 + DDD + número em `whatsapp`; o CTA de contato só muda para wa.me com um número em formato válido. Nenhum telefone, cliente ou resultado foi inventado.

Eventos opcionais: com analyticsEnabled ativo, escute `prospett:conversion` no window. detail.event será diagnostic_cta ou diagnostic_submitted; nenhum dado pessoal é incluído. Nenhum rastreador é instalado por padrão.

## Identidade e conteúdo

Tokens estão no início de `dist/styles.css`. Exemplos são explicitamente ilustrativos. Cases reais não são publicados sem dados e autorização. Ao alterar o domínio, atualize canonical, Open Graph, JSON-LD, sitemap e robots. A prévia publicada no Sites é privada por padrão.
