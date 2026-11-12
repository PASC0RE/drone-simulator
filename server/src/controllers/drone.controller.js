import { droneService } from '../services/drone.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDrones = asyncHandler(async (req, res) => {
  const drones = await droneService.getAll({ type: req.query.type });
  res.json({ count: drones.length, data: drones });
});

export const getDroneById = asyncHandler(async (req, res) => {
  const drone = await droneService.getById(req.params.id);
  res.json({ data: drone });
});
