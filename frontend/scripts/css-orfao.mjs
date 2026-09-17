import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function arquivos(pasta, extensao) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho, extensao);
    return caminho.endsWith(extensao) ? [caminho] : [];
  });
}

const codigo = arquivos('src', '.tsx').map((f) => readFileSync(f, 'utf8')).join('\n');
const orfas = [];
for (const css of arquivos('src/styles', '.css')) {
  const classes = new Set([...readFileSync(css, 'utf8').matchAll(/\.([a-z][a-z0-9_-]*)/g)].map((m) => m[1]));
  for (const classe of classes) {
    if (!new RegExp(`[\\s"'\`{]${classe}[\\s"'\`}]`).test(codigo)) orfas.push(`${css}: .${classe}`);
  }
}
console.log(orfas.length === 0 ? 'nenhuma classe órfã' : orfas.join('\n'));
process.exitCode = orfas.length === 0 ? 0 : 1;
