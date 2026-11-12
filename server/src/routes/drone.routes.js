import { Router } from 'express';
import { getDrones, getDroneById } from '../controllers/drone.controller.js';

const router = Router();

router.get('/', getDrones);        // GET /api/drones  (optional ?type=MILITARY|CIVILIAN)
router.get('/:id', getDroneById);  // GET /api/drones/:id

export default router;
