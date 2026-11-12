import { prisma } from '../config/db.js';

// The only layer that talks to the database.
export const droneRepository = {
  findAll(where = {}) {
    return prisma.drone.findMany({ where, orderBy: { id: 'asc' } });
  },

  findById(id) {
    return prisma.drone.findUnique({ where: { id } });
  },
};
