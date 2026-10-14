import { animate, stagger, inView, scroll } from 'framer-motion/dom';

const media = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 700px)');
const ease = [0.22, 1, 0.36, 1];
const controls = new Set();
const disposers = [];
const ambientControls = new Set();
let ambientPaused = false;
function play(target, frames, options) {
  const control = animate(target, frames, options);
  controls.add(control);
  control.then(() => controls.delete(control));
  return control;
}
function reset() {
  disposers.splice(0).forEach(stop => stop());
  controls.forEach(control => control.stop());
  controls.clear();
  ambientControls.clear();
  document.querySelectorAll('[data-motion]').forEach(el => {
    el.getAnimations().forEach(animation => animation.cancel());
    el.style.opacity = '1'; el.style.transform = 'none';
  });
}
function tag(selector) {
  const elements = [...document.querySelectorAll(selector)];
  elements.forEach(el => el.dataset.motion = 'true');
  return elements;
}
const entrance = tag('.hero-copy .location, .hero-copy h1, .hero-copy .intro, .hero-copy .actions, .hero-copy .trial');
const photo = tag('.hero-photo img')[0];
const awards = tag('.award-list article');
const detail = tag('.program-detail > div')[0];
const stageLights = [...document.querySelectorAll('.hero, .school, .contacts')].map(section => {
  const light = document.createElement('div');
  light.className = 'stage-light';
  light.setAttribute('aria-hidden','true');
  light.innerHTML = '<span class="stage-beam stage-beam-gold"></span><span class="stage-beam stage-beam-rose"></span><span class="stage-orbit"></span>';
  section.prepend(light);
  return light;
});
const beams = tag('.stage-beam, .stage-orbit');
const parallaxPhoto = tag('.hero-photo')[0];
const revealGroups = [...document.querySelectorAll('.section-head, .direction-grid, .teacher-grid, .review-grid, .schedule-grid, .gallery-grid, .video-grid, .achievement-layout, .offer-grid, .enrol-grid')];
revealGroups.forEach(group => [...group.children].forEach(el => el.dataset.motion = 'true'));
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.append(progressBar);
const toggle = document.createElement('button');
toggle.className = 'motion-toggle';
toggle.type = 'button';
toggle.setAttribute('aria-pressed', 'false');
toggle.textContent = 'Остановить фон';
document.querySelector('.hero').append(toggle);
function startAmbience() {
  if (media.matches || ambientPaused || document.hidden) return;
  beams.forEach((beam, index) => {
    const direction = index % 2 ? -1 : 1;
    const control = play(beam, {
      x: [0, direction * (narrow.matches ? 35 : 110), 0],
      y: [0, index % 3 ? -35 : 45, 0],
      rotate: [-8 * direction, 12 * direction, -8 * direction],
      scale: [1, 1.14, 1]
    }, {duration: 12 + index % 3 * 4, repeat: Infinity, ease: 'easeInOut'});
    ambientControls.add(control);
  });
}
function stopAmbience() {
  ambientControls.forEach(control => { control.stop(); controls.delete(control); });
  ambientControls.clear();
}
toggle.addEventListener('click', () => {
  ambientPaused = !ambientPaused;
  toggle.setAttribute('aria-pressed', String(ambientPaused));
  toggle.textContent = ambientPaused ? 'Включить фон' : 'Остановить фон';
  stopAmbience();
  startAmbience();
});
document.addEventListener('visibilitychange', () => {
  stopAmbience();
  startAmbience();
});
function start() {
  if (media.matches) return;
  startAmbience();
  play(entrance, { opacity: [0, 1], y: [48, 0] }, { duration: 0.85, delay: stagger(0.12), ease });
  play(photo, { opacity: [0.35, 1], scale: [1.14, 1.08] }, { duration: 1.5, ease });
  revealGroups.forEach(group => {
    const children = [...group.children];
    disposers.push(inView(children, element => {
      play(element, {opacity: [0.15, 1], y: [48, 0]}, {
        duration: 0.8, delay: (children.indexOf(element) % (narrow.matches ? 2 : 3)) * 0.08, ease
      });
    }, {amount: 'some', margin: '0px 0px -60px 0px'}));
  });
  disposers.push(inView('.award-list', () => {
    play(awards, { opacity: [0.35, 1], x: [12, 0] }, { duration: 0.45, delay: stagger(0.09), ease });
  }, { amount: 0.25 }));
  disposers.push(scroll(progress => {
    progressBar.style.transform = `scaleX(${progress})`;
  }));
  disposers.push(scroll(progress => {
    parallaxPhoto.style.transform = `translateY(${progress * (narrow.matches ? 35 : 120)}px)`;
    stageLights[0].style.transform = `translateY(${progress * -70}px)`;
  }, {target: document.querySelector('.hero'), offset: ['start start', 'end start']}));
}
media.addEventListener('change', () => {
  reset();
  const active = document.querySelector('[data-age][aria-pressed="true"]');
  if (active) updateProgram(Number(active.dataset.age));
  start();
});
narrow.addEventListener('change', () => { reset(); start(); });
start();

const programs = [
 ['Для самых маленьких','Движение начинается с игры','Ритмопластика и артикуляционная гимнастика. Знакомство с движением, ритмом и танцем в игровой форме.'],
 ['Для дошкольников','Почувствовать ритм','Развитие координации, ритма и гибкости. Первые танцевальные навыки в комплексной программе школы.'],
 ['Для детей 6–7 лет','Основа для большого пути','Основы классического, народного и современного танца. Знакомство с техникой и выразительностью.'],
 ['Для школьников и подростков','Танец выходит на сцену','Занятия хореографией, репертуар и концертные группы. Условия участия в выступлениях и конкурсах уточняются у педагогов.'],
 ['Для взрослых','Танцевать для себя','Боди-балет и танцы народов мира. Подходящую программу и действующее расписание поможет выбрать школа.']
];
document.getElementById('program-title').setAttribute('aria-live','polite');
let selection = 0;
let transition;
function updateProgram(index) {
  const [age,title,text] = programs[index];
  document.getElementById('program-age').textContent = age;
  document.getElementById('program-title').textContent = title;
  document.getElementById('program-text').textContent = text;
}
document.querySelectorAll('[data-age]').forEach(button => button.addEventListener('click', async () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  const current = ++selection;
  transition?.stop();
  document.querySelectorAll('[data-age]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  if (!media.matches) {
    transition = play(detail, { opacity: 0, y: -6 }, { duration: 0.12 });
    await transition;
  }
  if (current !== selection) return;
  updateProgram(Number(button.dataset.age));
  if (media.matches) { detail.style.opacity = '1'; detail.style.transform = 'none'; }
  else transition = play(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, ease });
}));
document.querySelectorAll('.button, [data-age]').forEach(button => {
  button.dataset.motion = 'true';
  button.addEventListener('pointerdown', () => {
    if (!media.matches) play(button, { scale: 0.97 }, { duration: 0.1 });
  });
  const release = () => { if (!media.matches) play(button, { scale: 1 }, { type: 'spring', stiffness: 450, damping: 30 }); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});
window.addEventListener('pagehide', reset);
window.addEventListener('pageshow', event => {
  if (event.persisted) { reset(); start(); }
});
document.documentElement.dataset.motionEngine = 'framer-motion';
document.querySelectorAll('[data-mail-form]').forEach(form => form.addEventListener('submit',event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const body = [...new FormData(form)].map(([name,value])=>`${name}: ${value}`).join('\n');
  const mail = `mailto:ans.likovanie@gmail.com?subject=${encodeURIComponent('Запись в школу танцев Ликование')}&body=${encodeURIComponent(body)}`;
  form.querySelector('[data-mail-status]').textContent = 'Письмо подготовлено. Отправьте его в почтовом приложении. Если приложение не открылось, позвоните +7 911 226 92 82.';
  window.location.href = mail;
}));
