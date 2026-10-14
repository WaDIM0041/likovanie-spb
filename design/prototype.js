const programs = [
  ['Для самых маленьких','Движение начинается с игры','Ритмопластика и артикуляционная гимнастика. Знакомство с движением, ритмом и танцем в игровой форме.'],
  ['Для дошкольников','Почувствовать ритм','Развитие координации, ритма и гибкости. Первые танцевальные навыки в комплексной программе школы.'],
  ['Для детей 6–7 лет','Основа для большого пути','Основы классического, народного и современного танца. Знакомство с техникой и выразительностью.'],
  ['Для школьников и подростков','Танец выходит на сцену','Занятия хореографией, репертуар и концертные группы. Условия участия в выступлениях и конкурсах уточняются у педагогов.'],
  ['Для взрослых','Танцевать для себя','Боди-балет и танцы народов мира. Подходящую программу и действующее расписание поможет выбрать школа.']
];
document.querySelectorAll('[data-age]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-age]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  const [age,title,text] = programs[Number(button.dataset.age)];
  document.getElementById('program-age').textContent = age;
  document.getElementById('program-title').textContent = title;
  document.getElementById('program-text').textContent = text;
}));
