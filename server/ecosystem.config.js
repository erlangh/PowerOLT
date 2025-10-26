module.exports = {
  apps: [{
    name: 'powerolt-api',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Optional backend envs; set as needed
      // CORS_ORIGIN: 'https://your-domain.com',
      // DB_PATH: '/home/youruser/PowerOLT/server/powerolt.db'
    },
    error_file: '../logs/api-error.log',
    out_file: '../logs/api-out.log',
    log_file: '../logs/api-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};