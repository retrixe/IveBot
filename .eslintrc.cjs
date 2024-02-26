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
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
    // Disable some interfering rules. TODO: Re-enable these!
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    // Allow no-multi-str.
    'no-multi-str': 'off'
  }
}
