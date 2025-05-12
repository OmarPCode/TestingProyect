module.exports = {
  default: {
    require: ['src/tests/bdd/steps/**/*.ts'], 
    paths: ['src/tests/bdd/features/**/*.feature'], 
    format: ['progress'],
  },
};