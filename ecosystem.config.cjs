module.exports = {
  apps: [
    {
      name: "sarkariafsar-api",
      cwd: "/home/ubuntu/apps/sarkariafsar/server",
      script: "server.mjs",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "sarkariafsar-front",
      cwd: "/home/ubuntu/apps/sarkariafsar/front",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
