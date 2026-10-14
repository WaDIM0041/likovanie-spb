const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { motion, animate, AnimatePresence } = require('framer-motion');
const version = require('framer-motion/package.json').version;
assert.equal(typeof animate, 'function');
assert.equal(typeof AnimatePresence, 'function');
const markup = renderToStaticMarkup(React.createElement(motion.div, {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
}, 'Motion ready'));
assert.match(markup, /Motion ready/);
assert.match(markup, /opacity:0/);
import('framer-motion').then((module) => {
  assert.equal(typeof module.animate, 'function');
  assert.ok(module.motion.div);
  console.log(`framer-motion ${version}: CommonJS, ESM and React server rendering passed`);
}).catch((error) => { console.error(error); process.exitCode = 1; });
