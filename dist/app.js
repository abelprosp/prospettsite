const config = window.PROSPETT_CONFIG || {};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');

menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  navigation?.classList.toggle('open', open);
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Abrir menu');
  navigation.classList.remove('open');
}));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.click();
    menu.focus();
  }
});

const steps = [
  ['A atenção vira uma visita.', 'Conteúdo, buscas e campanhas levam pessoas às páginas da empresa. A equipe define a mensagem; a mensuração ajuda a entender de onde vêm os acessos.', 'Estratégia + mensuração'],
  ['Uma visita abre uma conversa.', 'O formulário registra o interesse e encaminha os dados necessários. A confirmação depende de uma integração ativa; a equipe define a abordagem e o prazo de retorno.', 'Captura + contexto'],
  ['Cada oportunidade ganha contexto.', 'Regras aprovadas organizam os contatos por interesse e momento de compra. A equipe revisa exceções e valida os critérios de qualificação.', 'Automação + revisão humana'],
  ['O contato chega ao lugar certo.', 'A integração registra a oportunidade no CRM, atribui um responsável e organiza o histórico. A equipe comercial acompanha e mantém as informações atualizadas.', 'Integração + responsabilidade'],
  ['Relacionamento com continuidade.', 'Lembretes e comunicações autorizadas ajudam a manter o acompanhamento. A equipe conduz as conversas, entende necessidades e aprova mensagens e propostas.', 'Lembretes + relacionamento'],
  ['O aprendizado orienta a próxima ação.', 'Indicadores mostram como os contatos avançam. A equipe interpreta os dados, identifica obstáculos e ajusta campanhas, conteúdos e fluxos.', 'Dados + decisão humana']
];

const tabs = [...document.querySelectorAll('[data-step]')];
const panel = document.querySelector('#flow-panel');

function selectStep(index) {
  tabs.forEach((tab, number) => {
    const selected = number === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  if (!panel) return;
  panel.setAttribute('aria-labelledby', 'step-' + index);
  panel.querySelector('.step-number').textContent = `0${index + 1} / 06`;
  panel.querySelector('h3').textContent = steps[index][0];
  panel.querySelector('p').textContent = steps[index][1];
  panel.querySelector('.flow-tag').textContent = steps[index][2];
  if (!reduceMotion) {
    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.classList.add('swap');
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStep(index));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % 6;
    if (event.key === 'ArrowLeft') next = (index + 5) % 6;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 5;
    if (next === undefined) return;
    event.preventDefault();
    selectStep(next);
    tabs[next].focus();
  });
});

const animated = document.querySelectorAll('[data-animate]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  animated.forEach((element) => observer.observe(element));
} else {
  animated.forEach((element) => element.classList.add('in'));
}

const header = document.querySelector('#header');
const progress = document.querySelector('.scroll-progress');
let scrollQueued = false;

function updateScroll() {
  scrollQueued = false;
  if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  if (!progress) return;
  const root = document.documentElement;
  const max = root.scrollHeight - root.clientHeight;
  progress.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
}

function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updateScroll);
}

updateScroll();
window.addEventListener('scroll', onScroll, { passive: true });

function track(name) {
  if (config.analyticsEnabled) window.dispatchEvent(new CustomEvent('prospett:conversion', { detail: { event: name } }));
}

document.querySelectorAll('a[href="#diagnostico"]').forEach((link) => link.addEventListener('click', () => track('diagnostic_cta')));

const number = (config.whatsapp || '').replace(/\D/g, '');
if (/^55\d{10,11}$/.test(number)) {
  document.querySelectorAll('[data-contact]').forEach((link) => {
    link.href = 'https://wa.me/' + number;
    link.rel = 'noopener noreferrer';
  });
}

const form = document.querySelector('#diagnostic-form');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const status = document.querySelector('#form-status');
  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  if (data.fax) return;
  delete data.fax;
  if (!config.formEndpoint) {
    status.textContent = 'O envio está temporariamente indisponível. Seus dados não foram enviados. Tente novamente quando o canal de atendimento estiver disponível.';
    status.dataset.state = 'error';
    return;
  }
  const phone = data.phone.replace(/\D/g, '');
  if (phone && (phone.length < 10 || phone.length > 13)) {
    status.textContent = 'Confira o WhatsApp e inclua o DDD.';
    form.elements.phone.focus();
    return;
  }
  button.disabled = true;
  button.textContent = 'Enviando…';
  status.textContent = 'Enviando sua solicitação com segurança.';
  status.dataset.state = 'pending';
  try {
    const endpoint = new URL(config.formEndpoint, location.origin);
    if (endpoint.protocol !== 'https:' && endpoint.origin !== location.origin) throw new Error('Invalid endpoint');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Request failed');
    status.textContent = 'Solicitação enviada. A Prospett entrará em contato para conversar sobre seu diagnóstico.';
    status.dataset.state = 'success';
    form.reset();
    track('diagnostic_submitted');
  } catch {
    status.textContent = 'Não foi possível confirmar o envio. Seus dados foram mantidos no formulário. Tente novamente em instantes.';
    status.dataset.state = 'error';
  } finally {
    button.disabled = false;
    button.textContent = 'Solicitar diagnóstico';
  }
});

document.querySelectorAll('[data-privacy-contact]').forEach((element) => {
  if (config.privacyContact) element.textContent = config.privacyContact;
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
