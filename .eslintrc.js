module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  extends: ['plugin:react/recommended', 'standard', 'standard-react'],
  plugins: ['react', 'graphql', 'react-hooks', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'graphql/template-strings': ['error', {
      env: 'apollo',
      schemaString: require('fs').readFileSync(
        require('path').resolve(__dirname, 'server/schema.graphql'),
        { encoding: 'utf8' }
      )
    }],
    // React Hooks rules.
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript styling.
    '@typescript-eslint/no-explicit-any': ['error'],
    '@typescript-eslint/type-annotation-spacing': ['error'],
    '@typescript-eslint/no-namespace': ['error'],
    '@typescript-eslint/interface-name-prefix': ['error'],
    '@typescript-eslint/no-angle-bracket-type-assertion': ['error'],
    // Fix no-unused-vars.
    '@typescript-eslint/no-unused-vars': ['error'],
    // Make TypeScript ESLint less strict.
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/triple-slash-reference': 'off'
  }
}
