// tsc não copia arquivos não-TS. As migrations precisam existir ao lado do
// migrate.js compilado para `npm run migrate:prod` funcionar dentro do container.
import { cp } from 'node:fs/promises';

await cp('src/db/migrations', 'dist/db/migrations', { recursive: true });
console.log('[build] migrations copiadas para dist/db/migrations');
