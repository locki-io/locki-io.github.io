export default {
  // default base because the site is on locki-io/locki-io.github.io
  base: '/',
  build: {
    rollupOptions: {
      // multi-page: the homepage, and the Act I stage where the seed is grown
      input: { main: 'index.html', seed: 'seed.html' },
    },
  },
};
