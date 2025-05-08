module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Add any custom rules here
  },
  settings: {
    // Modern ESLint configuration
    // These settings replace the removed options that were causing errors
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      // TypeScript specific settings
    }
  ]
};