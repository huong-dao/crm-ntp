/**
 * PM2 config — chạy trên server sau khi npm run build
 *
 * pm2 start ecosystem.config.cjs
 * pm2 save
 */
module.exports = {
  apps: [
    {
      name: "ntp-app",
      script: "app.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
