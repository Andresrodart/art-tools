const { createDefaultPreset } = require('ts-jest')

const tsJestTransformCfg = createDefaultPreset({
  tsconfig: 'tsconfig.web.json'
}).transform

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    ...tsJestTransformCfg
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx']
}
