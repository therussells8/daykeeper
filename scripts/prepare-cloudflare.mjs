import { cp, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const project = JSON.parse(await readFile(path.join(root,'cloudflare.project.json'),'utf8'));
const config = JSON.parse(await readFile(path.join(root,'dist/server/wrangler.json'),'utf8'));
const database = config.d1_databases?.find(database => database.binding === 'DB');
if (config.name !== project.name || database?.database_id !== project.database.id) {
  throw new Error('Cloudflare build does not match the configured Daykeeper Worker and database.');
}
if (config.assets?.binding !== 'ASSETS') throw new Error('Missing authenticated asset binding.');
// Wrangler resolves migrations_dir relative to its generated config in dist/server.
await mkdir(path.join(root,'dist/server/drizzle'),{recursive:true});
await cp(path.join(root,'drizzle'),path.join(root,'dist/server/drizzle'),{recursive:true});
console.log('Prepared Daykeeper Worker and D1 migrations for Cloudflare.');
