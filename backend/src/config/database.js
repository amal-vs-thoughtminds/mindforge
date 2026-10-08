const base = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'mindforge',
  username: process.env.DB_USER || 'mindforge',
  password: process.env.DB_PASSWORD || 'mindforge',
  logging: false,
};

// sequelize-cli reads the config keyed by NODE_ENV.
module.exports = {
  development: base,
  test: base,
  production: base,
};
