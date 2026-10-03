const { existsSync, readFileSync } = require('node:fs')
const { createInstrumenter } = require('istanbul-lib-instrument')
const { transform } = require('esbuild')

const chromeCandidates = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const chromePath = chromeCandidates.find(path => path && existsSync(path))
if (!process.env.CHROME_BIN && chromePath) process.env.CHROME_BIN = chromePath

const instrumentApplication = {
  name: 'instrument-prostock-source',
  setup(build) {
    build.onLoad({ filter: /[\\/]src[\\/].+\.(js|jsx)$/ }, async args => {
      const source = readFileSync(args.path, 'utf8')
      const compiled = await transform(source, {
        loader: args.path.endsWith('.jsx') ? 'jsx' : 'js',
        sourcefile: args.path,
        target: 'es2022',
        jsx: 'automatic',
        define: {
          'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:8080'),
          'import.meta.env.VITE_USE_API': JSON.stringify('false'),
        },
      })
      const instrumenter = createInstrumenter({ esModules: true })
      return {
        contents: instrumenter.instrumentSync(compiled.code, args.path),
        loader: 'js',
      }
    })
  },
}

module.exports = config => {
  const coverageEnabled = process.env.npm_lifecycle_event === 'test:coverage'
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
      plugins: coverageEnabled ? [instrumentApplication] : [],
    },
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-esbuild'),
      require('karma-coverage'),
    ],
    reporters: coverageEnabled ? ['progress', 'coverage'] : ['progress'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'text-summary' },
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.', file: 'lcov.info' },
      ],
    },
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false,
  })
}
