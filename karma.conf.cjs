module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    files: ['tests/.compiled/tests.js'],
    reporters: ['progress'],
    browsers: ['jsdom'],
    singleRun: true,
    client: {
      jasmine: {
        random: false,
      },
    },
  })
}
