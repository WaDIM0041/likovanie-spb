import { animate, stagger, inView, scroll } from 'framer-motion/dom';

const media = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 700px)');
const ease = [0.22, 1, 0.36, 1];
const controls = new Set();
const disposers = [];
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
const light = document.createElement('div');
light.className = 'stage-light';
light.setAttribute('aria-hidden','true');
document.querySelector('.hero').prepend(light);
tag('.stage-light');
function start() {
  if (media.matches) return;
  play(entrance, { opacity: [0, 1], y: [18, 0] }, { duration: 0.65, delay: stagger(0.09), ease });
  play(photo, { opacity: [0.65, 1], scale: [1.025, 1] }, { duration: 1, ease });
  play(light, { opacity: [0, 1], rotate: [-4, 0] }, { duration: 1.2, ease });
  disposers.push(inView('.award-list', () => {
    play(awards, { opacity: [0.35, 1], x: [12, 0] }, { duration: 0.45, delay: stagger(0.09), ease });
  }, { amount: 0.25 }));
  if (!narrow.matches) {
    disposers.push(scroll(progress => {
      if (!media.matches) photo.style.transform = `translateY(${progress * 18}px) scale(1.025)`;
      if (!media.matches) light.style.transform = `translateX(${progress * 24}px) rotate(${progress * 3}deg)`;
    }, { target: document.querySelector('.hero'), offset: ['start start', 'end start'] }));
  }
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
document.documentElement.dataset.motionEngine = 'framer-motion';
