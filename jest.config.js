export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/tests/**/*.test.ts"],
  verbose: true,
  globalSetup: './tests/setup/global.ts',
  setupFilesAfterEnv: ['./tests/setup/index.ts'],
};
