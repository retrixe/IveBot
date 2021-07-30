module.exports = {
  extends: ['../.eslintrc.js'],
  env: {
    es6: true,
    node: true,
    browser: true
  },
  parserOptions: {
    project: './dashboard/tsconfig.json'
  }
}
