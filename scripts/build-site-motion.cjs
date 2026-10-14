const {rollup}=require('rollup');
const {nodeResolve}=require('@rollup/plugin-node-resolve');
const replace=require('@rollup/plugin-replace');
const terser=require('@rollup/plugin-terser');
(async()=>{
 const bundle=await rollup({input:'design/motion-source.js',plugins:[nodeResolve({browser:true}),replace({preventAssignment:true,'process.env.NODE_ENV':JSON.stringify('production')}),terser()]});
 await bundle.write({file:'design/motion-bundle.js',format:'iife'});
 await bundle.close();
 console.log('Built design/motion-bundle.js from local Framer Motion');
})().catch(e=>{console.error(e);process.exitCode=1});
