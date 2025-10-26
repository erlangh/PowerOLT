const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./lib/db');
const { startSimulator, subscribeSimulator } = require('./lib/oltSimulator');

const app = express();
// Allow any origin unless CORS_ORIGIN is set (comma-separated)
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
const onusRouter = require('./routes/onus');
const oltsRouter = require('./routes/olts');
const exportRouter = require('./routes/export');
const odpsRouter = require('./routes/odps');
const cablesRouter = require('./routes/cables');
const speedProfilesRouter = require('./routes/speedProfiles');
const vlansRouter = require('./routes/vlans');
const onuTypesRouter = require('./routes/onuTypes');

app.use('/api/onus', onusRouter);
app.use('/api/olts', oltsRouter);
app.use('/api/export', exportRouter);
app.use('/api/odps', odpsRouter);
app.use('/api/cables', cablesRouter);
app.use('/api/speed-profiles', speedProfilesRouter);
app.use('/api/vlans', vlansRouter);
app.use('/api/onu-types', onuTypesRouter);

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins }
});

// Socket events: push realtime ONU updates
subscribeSimulator((update) => {
  io.emit('onu_update', update);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`PowerOLT backend listening on http://localhost:${PORT}`);
  // Ensure DB is initialized and seed some demo data
  db.init();
  startSimulator();
});