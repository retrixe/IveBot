module.exports = {
  extends: ['../.eslintrc.cjs'],
  env: {
    es6: true,
    node: true,
    browser: true
  },
  parserOptions: {
    project: './dashboard/tsconfig.json'
  }
}
