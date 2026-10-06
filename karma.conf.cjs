module.exports = config => {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: ['tests/**/*.spec.js'],
    preprocessors: {
      'tests/**/*.spec.js': ['esbuild'],
    },
    esbuild: {
      loader: { '.js': 'jsx', '.jsx': 'jsx' },
      target: 'es2022',
      jsx: 'automatic',
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:8080'),
        'import.meta.env.VITE_USE_API': JSON.stringify('false'),
      },
    },
    plugins: [
      require('karma-jasmine'),
      require('karma-jsdom-launcher'),
      require('karma-esbuild'),
    ],
    reporters: ['progress'],
    browsers: ['jsdom'],
    singleRun: true,
    restartOnFileChange: false,
  })
}
