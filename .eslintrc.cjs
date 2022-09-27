module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'standard-with-typescript', 'standard-react', 'standard-jsx'],
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    /* 'graphql/template-strings': ['error', {
      env: 'apollo',
      schemaString: require('fs').readFileSync(
        require('path').resolve(__dirname, 'dashboard/schema.graphql'),
        { encoding: 'utf8' }
      )
    }], */
    // Make TypeScript ESLint less strict.
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    // Disable some interfering rules.
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    // Set strict rules regarding async/await.
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'error',
    // Allow no-multi-str.
    'no-multi-str': 'off'
  }
}
