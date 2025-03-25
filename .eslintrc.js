import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: true,
        document: true,

        // Test globals
        describe: true,
        beforeEach: true,
        it: true,
        afterEach: true,
        after: true,
        before: true,
        beforeAll: true
      }
    },
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'no-extra-semi': 0,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  },
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**']
  }
]