export default {
  // default base because the site is on locki-io/locki-io.github.io
  base: '/',
  // Dev port is registry-assigned: ~/.claude/vaettir-app-registry.yaml → free_electrons.locki-io.ports [5193].
  // Vite's default 5173 collides with the local Opik (same endpoint as opik.vaettir.io).
  // strictPort: fail loudly rather than drift onto another project's port.
  server: { port: 5193, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      // multi-page: the homepage, and the Act I stage where the seed is grown
      input: { main: 'index.html', seed: 'seed.html', void: 'void.html' },
    },
  },
};
