module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Add any custom rules here
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      // TypeScript specific settings
    }
  ]
};