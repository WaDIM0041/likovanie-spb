import { animate, stagger, inView, scroll } from 'framer-motion/dom';
import { createRibbonScene } from './ribbon-scene.js';

const media = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 700px)');
const ribbonScene = createRibbonScene(document.querySelector('.stage-banner'));
const ease = [0.22, 1, 0.36, 1];
const controls = new Set();
const disposers = [];
const ambientControls = new Set();
let ambientPaused = false;
let manualMotion = false;
function reduced() { return media.matches && !manualMotion; }
function play(target, frames, options) {
  const control = animate(target, frames, options);
  controls.add(control);
  control.then(() => controls.delete(control));
  return control;
}
function reset() {
  ribbonScene.setMotion(false);
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
const stageSection = document.querySelector('.hero');
const photoCaption = document.querySelector('.hero-photo figcaption');
const curtains = ['left', 'right'].map(side => {
  const curtain = document.createElement('div');
  curtain.className = `stage-curtain stage-curtain-${side}`;
  curtain.setAttribute('aria-hidden', 'true');
  stageSection.querySelector('.hero-photo').append(curtain);
  return curtain;
});
const prefix = location.pathname.includes('/design/') ? '../' : '';
const scenes = [
  {src: '003.jpg', alt: 'Артистка ансамбля в народном костюме на сцене', label: 'Сцена'},
  {src: '002.jpg', alt: 'Ученицы занимаются у хореографического станка', label: 'Занятия'},
  {src: '091.jpg', alt: 'Ансамбль на сцене', label: 'Ансамбль'}
];
const sceneButtons = scenes.map((scene, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.scene = String(index);
  button.setAttribute('aria-pressed', String(index === 0));
  button.textContent = `${String(index + 1).padStart(2, '0')} / ${scene.label}`;
  return button;
});
const scenePicker = document.createElement('div');
scenePicker.className = 'hero-scene-picker';
scenePicker.setAttribute('role', 'group');
scenePicker.setAttribute('aria-label', 'Выберите сцену на главном экране');
sceneButtons.forEach(button => scenePicker.append(button));
stageSection.append(scenePicker);
let activeScene = 0;
let sceneRequest = 0;
let sceneTransition;
let transitionImage;
sceneButtons.forEach(button => button.addEventListener('click', async () => {
  const index = Number(button.dataset.scene);
  if (index === activeScene) return;
  const request = ++sceneRequest;
  sceneTransition?.stop();
  transitionImage?.remove();
  transitionImage = null;
  sceneButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  if (!reduced()) {
    const next = new Image();
    next.className = 'scene-transition-image';
    next.src = `${prefix}research/assets/${scenes[index].src}`;
    next.alt = '';
    next.setAttribute('aria-hidden', 'true');
    transitionImage = next;
    photo.parentElement.append(next);
    sceneTransition = play(next, {opacity: [0, 1], scale: [1.09, 1.04]}, {duration: 0.72, ease});
    const captionOut = play(photoCaption, {opacity: [1, 0], y: [0, -5]}, {duration: 0.16, ease});
    await Promise.all([sceneTransition, captionOut]);
  }
  if (request !== sceneRequest) return;
  activeScene = index;
  photo.src = `${prefix}research/assets/${scenes[index].src}`;
  photo.alt = scenes[index].alt;
  photoCaption.textContent = scenes[index].label;
  transitionImage?.remove();
  transitionImage = null;
  if (!reduced()) sceneTransition = play(photoCaption, {opacity: [0, 1], y: [5, 0]}, {duration: 0.32, ease});
  else {photo.style.opacity = '1'; photo.style.transform = 'none'; photoCaption.style.opacity = '1'; photoCaption.style.transform = 'none';}
}));
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
const marquee = tag('.stage-marquee-track')[0];
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
toggle.textContent = reduced() ? 'Включить эффекты' : 'Остановить фон';
document.querySelector('.hero').append(toggle);
function startAmbience() {
  if (reduced() || ambientPaused || document.hidden) return;
  ribbonScene.setMotion(true);
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
  if (marquee) {
    const [sequence, copy] = marquee.children;
    while (sequence.getBoundingClientRect().width < innerWidth) {
      sequence.innerHTML += sequence.innerHTML;
    }
    copy.innerHTML = sequence.innerHTML;
    const control = play(marquee, {x: [0, -sequence.getBoundingClientRect().width]}, {
      duration: 30, repeat: Infinity, ease: 'linear'
    });
    ambientControls.add(control);
  }
}
function stopAmbience() {
  ribbonScene.setMotion(false);
  ambientControls.forEach(control => { control.stop(); controls.delete(control); });
  ambientControls.clear();
}
toggle.addEventListener('click', () => {
  if (reduced()) {
    manualMotion = true;
    ambientPaused = false;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Остановить фон';
    reset(); start();
    return;
  }
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
  document.documentElement.dataset.motionPreference = manualMotion ? 'manual' : reduced() ? 'off' : 'on';
  ribbonScene.setMotion(!reduced() && !ambientPaused && !document.hidden);
  if (reduced()) return;
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
  const headerHeight = Math.round(document.querySelector('header').getBoundingClientRect().height);
  disposers.push(scroll(progress => {
    parallaxPhoto.style.transform = `translateY(${progress * (narrow.matches ? 35 : 120)}px)`;
    stageLights[0].style.transform = `translateY(${progress * -70}px)`;
    const open = Math.min(1, 0.38 + progress * 2.8);
    curtains[0].style.transform = `translateX(${-open * 100}%)`;
    curtains[1].style.transform = `translateX(${open * 100}%)`;
  }, {target: stageSection, offset: [`start ${headerHeight}px`, `end ${headerHeight}px`]}));
}
media.addEventListener('change', () => {
  manualMotion = false;
  toggle.textContent = reduced() ? 'Включить эффекты' : ambientPaused ? 'Включить фон' : 'Остановить фон';
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
  if (!reduced()) {
    transition = play(detail, { opacity: 0, y: -6 }, { duration: 0.12 });
    await transition;
  }
  if (current !== selection) return;
  updateProgram(Number(button.dataset.age));
  if (reduced()) { detail.style.opacity = '1'; detail.style.transform = 'none'; }
  else transition = play(detail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, ease });
}));
document.querySelectorAll('.button, [data-age], .hero-scene-picker button').forEach(button => {
  button.dataset.motion = 'true';
  button.addEventListener('pointerdown', () => {
    if (!reduced()) play(button, { scale: 0.97 }, { duration: 0.1 });
  });
  const release = () => { if (!reduced()) play(button, { scale: 1 }, { type: 'spring', stiffness: 450, damping: 30 }); };
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
let pointerFrame = 0;
stageSection.addEventListener('pointermove', event => {
  if (narrow.matches || reduced() || pointerFrame) return;
  const bounds = stageSection.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * 100;
  const y = (event.clientY - bounds.top) / bounds.height * 100;
  pointerFrame = requestAnimationFrame(() => {
    stageSection.style.setProperty('--stage-x', `${x}%`);
    stageSection.style.setProperty('--stage-y', `${y}%`);
    pointerFrame = 0;
  });
});
