import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const drones = JSON.parse(
  readFileSync(new URL('./seed-data/drones.json', import.meta.url), 'utf-8')
);

async function main() {
  for (const drone of drones) {
    // upsert on the unique name so the seed can be run repeatedly
    await prisma.drone.upsert({
      where: { name: drone.name },
      update: drone,
      create: drone,
    });
  }
  console.log(`Seeded ${drones.length} drones.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
