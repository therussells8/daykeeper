import vinext from 'vinext';
import { defineConfig } from 'vite';
import { configureToolEnvironment } from './scripts/tool-environment.mjs';
import project from './cloudflare.project.json';

export default defineConfig(async () => {
  configureToolEnvironment(process.cwd());
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    server: { host: '127.0.0.1' },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
        config: {
          name: project.name,
          main: './worker/index.ts',
          compatibility_date: project.compatibilityDate,
          compatibility_flags: ['nodejs_compat'],
          workers_dev: true,
          preview_urls: false,
          keep_vars: true,
          assets: { binding: 'ASSETS', run_worker_first: true },
          observability: { enabled: true, traces: { enabled: true, head_sampling_rate: 0.1 } },
          d1_databases: [{
            binding: 'DB',
            database_name: project.database.name,
            database_id: project.database.id,
            migrations_dir: './drizzle',
          }],
        },
      }),
    ],
  };
});
