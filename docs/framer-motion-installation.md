# Framer Motion из GitHub

Источник: https://github.com/motiondivision/motion

Исходники находятся в `vendor/motion`. Зафиксированный коммит:
`790a654dfef305307c566cf4e94d67a9f7a403c8`.

Локальная поправка к исходникам: в
`packages/framer-motion/src/render/html/supported-elements.ts` тип `webview`
заменён с `HTMLWebViewElement` на `HTMLElement`. Это устраняет зависимость
DOM-деклараций от глобальных типов React и позволяет пройти штатный
`check-bundle.js`. При повторном клонировании следует повторить эту поправку.

Пакеты `framer-motion` 14.2.0, `motion-dom` 14.2.0 и `motion-utils` 14.1.1
подключены как локальные npm workspaces. Их код собирается из исходников GitHub;
инструменты сборки и React скачиваются из npm.

Повторная установка и проверка из корня проекта:

```powershell
npm ci --ignore-scripts
npm run build:motion
npm run check:motion
```

Если `vendor/motion` отсутствует, сначала восстановите исходники:

```powershell
git clone https://github.com/motiondivision/motion.git vendor/motion
git -C vendor/motion checkout 790a654dfef305307c566cf4e94d67a9f7a403c8
```

Использование в React:

```jsx
import { motion } from "framer-motion";

export function Example() {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Ликование</motion.div>;
}
```

`check:motion` проверяет CommonJS, ESM и серверный рендер React.
Проверку анимации в браузере следует выполнить после создания приложения сайта.
