import { build } from 'esbuild';
import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
await mkdir('dist/diary',{recursive:true});
await build({entryPoints:['src/firebase-client.mjs'],outfile:'dist/diary/firebase-client.mjs',bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,legalComments:'external',metafile:true}).then(async result=>writeFile('dist/diary/firebase-client.meta.json',JSON.stringify({inputs:Object.keys(result.metafile.inputs).map(p=>p.replace(/^node_modules\//,''))})));
// Export an allowlist. Neither local diary files nor Sites metadata are included.
await rm('pages-output',{recursive:true,force:true});
await mkdir('pages-output',{recursive:true});
for(const file of ['index.html','style.css','app.mjs','apps.mjs','core.mjs','icon.svg'])await cp(`dist/${file}`,`pages-output/${file}`);
await cp('dist/diary','pages-output/diary',{recursive:true,filter:source=>!source.endsWith('.meta.json')});
await writeFile('pages-output/.nojekyll','');
console.log('Built diary client and allowlisted Pages output.');
