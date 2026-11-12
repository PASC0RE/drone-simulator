import { Router } from 'express';
import droneRoutes from './drone.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/drones', droneRoutes);

export default router;
