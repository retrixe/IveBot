module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  extends: ["plugin:react/recommended", "standard", "standard-react"],
  plugins: ["react", "graphql", "typescript"],
  parser: "typescript-eslint-parser",
  rules: {
    'graphql/template-strings': ['error', {
      env: 'apollo',
      schemaString: require('fs').readFileSync(
        require('path').resolve(__dirname, 'server/schema.graphql'),
        { encoding: 'utf8' }
      )
    }],
    // TypeScript styling.
    "typescript/no-explicit-any": ["error"],
    "typescript/type-annotation-spacing": ["error"],
    "typescript/no-namespace": ["error"],
    "typescript/interface-name-prefix": ["error"],
    "typescript/no-angle-bracket-type-assertion": ["error"],
    // Fix no-unused-vars.
    "typescript/no-unused-vars": ["error"]
  }
}
