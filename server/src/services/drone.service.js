import { droneRepository } from '../repositories/drone.repository.js';
import { ApiError } from '../utils/ApiError.js';

const VALID_TYPES = ['MILITARY', 'CIVILIAN'];

export const droneService = {
  async getAll({ type } = {}) {
    const where = {};

    if (type) {
      const normalized = String(type).toUpperCase();
      if (!VALID_TYPES.includes(normalized)) {
        throw new ApiError(400, `Invalid type. Use one of: ${VALID_TYPES.join(', ')}`);
      }
      where.type = normalized;
    }

    return droneRepository.findAll(where);
  },

  async getById(rawId) {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, 'Drone id must be a positive integer');
    }

    const drone = await droneRepository.findById(id);
    if (!drone) {
      throw new ApiError(404, `Drone with id ${id} not found`);
    }
    return drone;
  },
};
