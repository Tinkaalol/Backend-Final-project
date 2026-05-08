import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import decayRoutes from './decay.routes.js';
import locationRoutes from './location.routes.js';
import forecastRoutes from './forecast.routes.js';
import queueRoutes from './queue.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/decay', decayRoutes);
router.use('/locations', locationRoutes);
router.use('/forecast', forecastRoutes);
router.use('/queue', queueRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
