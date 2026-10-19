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
  ['A demanda chega sem clique comprado.', 'Quem já procura encontra a empresa. Essa visita entra na conta do CAC no lugar de uma sequência de anúncios pagos.', 'Tráfego orgânico'],
  ['A IA prepara o próximo passo.', 'A inteligência lê o interesse e sugere a qualificação. A equipe aprova o critério e revisa a exceção.', 'Inteligência artificial'],
  ['O cliente fica registrado.', 'Formulário, responsável e histórico entram no fluxo comercial. A captura acontece sem alguém copiar o contato à mão.', 'Automação comercial']
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
  const total = String(steps.length).padStart(2, '0');
  panel.querySelector('.step-number').textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
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
    const total = steps.length;
    if (event.key === 'ArrowRight') next = (index + 1) % total;
    if (event.key === 'ArrowLeft') next = (index + total - 1) % total;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = total - 1;
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
  const phone = String(data.phone || '').replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 13) {
    status.textContent = 'Confira o WhatsApp e inclua o DDD.';
    status.dataset.state = 'error';
    form.elements.phone.focus();
    return;
  }
  if (!config.formEndpoint) {
    status.textContent = 'O envio está temporariamente indisponível. Seus dados não foram enviados. Tente novamente quando o canal de atendimento estiver disponível.';
    status.dataset.state = 'error';
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Request failed');
    status.textContent = 'Pedido recebido. O relatório executivo segue para o seu WhatsApp em instantes.';
    status.dataset.state = 'success';
    form.reset();
    track('diagnostic_submitted');
  } catch {
    status.textContent = 'Não foi possível confirmar o envio. Seus dados foram mantidos no formulário. Tente novamente em instantes.';
    status.dataset.state = 'error';
  } finally {
    button.disabled = false;
    button.textContent = 'Receber o relatório no WhatsApp';
  }
});

document.querySelectorAll('[data-privacy-contact]').forEach((element) => {
  if (config.privacyContact) element.textContent = config.privacyContact;
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
