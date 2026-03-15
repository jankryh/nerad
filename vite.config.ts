import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pidApiKey = env.PID_API_KEY;

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'https://api.golemio.cz/v2',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: pidApiKey
            ? {
                'X-Access-Token': pidApiKey,
              }
            : undefined,
        },
      },
    },
  };
});
