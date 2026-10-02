import cors                    from 'cors';
import express                 from 'express';
import availableItemsRoutes    from './routes/availableItems.routes.js';
import selectedItemsRoutes     from './routes/selectedItems.routes.js';
import type { HealthResponse } from '@sorter/common';


export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', availableItemsRoutes);
  app.use('/api', selectedItemsRoutes);

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok', time: new Date().toISOString() };
    res.json(body);
  });

  return app;
};
