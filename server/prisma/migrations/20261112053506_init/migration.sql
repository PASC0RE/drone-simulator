-- CreateEnum
CREATE TYPE "DroneType" AS ENUM ('MILITARY', 'CIVILIAN');

-- CreateTable
CREATE TABLE "drones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DroneType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "maxSpeed" DOUBLE PRECISION NOT NULL,
    "batteryLife" DOUBLE PRECISION NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drones_name_key" ON "drones"("name");
