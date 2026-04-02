import tsParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';

// Cognitive complexity threshold — lower = stricter. SonarQube default is 15.
const THRESHOLD = parseInt(process.env.COMPLEXITY_THRESHOLD ?? '15', 10);

export default [
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', 'node_modules/**'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: { sonarjs },
    rules: {
      'sonarjs/cognitive-complexity': ['warn', THRESHOLD],
    },
  },
];
