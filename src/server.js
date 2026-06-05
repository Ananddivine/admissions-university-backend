import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDatabase } from './config/database.js';
import { createServer } from 'http';
import { initSocket } from './utils/socket.js';
import { seedAdminUser } from './utils/seedAdmin.js';
import { seedUniversities } from './utils/seedUniversities.js';

const port = process.env.PORT || 5000;
const server = createServer(app);
initSocket(server);

connectDatabase()
  .then(async () => {
    await seedAdminUser();
    await seedUniversities();
    server.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to start server', error);
    process.exit(1);
  });
