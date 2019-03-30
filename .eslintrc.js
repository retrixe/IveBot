module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  extends: ["plugin:react/recommended", "standard", "standard-react"],
  plugins: ["react", "graphql", "@typescript-eslint/eslint-plugin"],
  parser: "@typescript-eslint/parser",
  rules: {
    'graphql/template-strings': ['error', {
      env: 'apollo',
      schemaString: require('fs').readFileSync(
        require('path').resolve(__dirname, 'server/schema.graphql'),
        { encoding: 'utf8' }
      )
    }],
    // TypeScript styling.
    "@typescript-eslint/no-explicit-any": ["error"],
    "@typescript-eslint/type-annotation-spacing": ["error"],
    "@typescript-eslint/no-namespace": ["error"],
    "@typescript-eslint/interface-name-prefix": ["error"],
    "@typescript-eslint/no-angle-bracket-type-assertion": ["error"],
    // Fix no-unused-vars.
    "@typescript-eslint/no-unused-vars": ["error"]
  }
}
