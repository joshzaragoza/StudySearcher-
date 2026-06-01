module.exports = {
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: [
    {
      command: "npm start",
      url: "http://localhost:3000",
      reuseExistingServer: true,
    },
    {
      command: "npm --prefix client run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
  ],
};