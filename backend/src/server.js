const app = require('./app');
const { sequelize } = require('./models');

const port = Number(process.env.PORT || 4000);

async function start() {
  await sequelize.authenticate();
  const server = app.listen(port, () => console.log(`API listening on :${port}`));

  const shutdown = () => server.close(() => sequelize.close().then(() => process.exit(0)));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
