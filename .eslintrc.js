module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  extends: ["plugin:react/recommended", "standard", "standard-react"],
  plugins: ["react", "graphql"],
  parser: "babel-eslint",
  rules: {
    'graphql/template-strings': ['error', {
      env: 'apollo',
      schemaString: require('fs').readFileSync(
        require('path').resolve(__dirname, 'server/schema.graphql'),
        { encoding: 'utf8' }
      )
    }]
  }
}
