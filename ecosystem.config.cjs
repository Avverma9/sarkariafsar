module.exports = {
  apps: [
    {
      name: "sarkariafsar-api",
      cwd: "/home/ubuntu/apps/sarkariafsar/server",
      script: "index.js",
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
    {
      name: "sarkariafsar-panel",     
      cwd: "/home/ubuntu/apps/sarkariafsar/panel",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
