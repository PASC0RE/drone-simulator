// Offline copy of the seed data (same order => same ids as the database).
// Used only when the API cannot be reached, so the site still works.
export const FALLBACK_DRONES = [
  {
    "id": 1,
    "name": "Falcon R4 Recon Quadcopter",
    "type": "CIVILIAN",
    "weight": 1.4,
    "maxSpeed": 68,
    "batteryLife": 38,
    "modelUrl": "/assets/models/falcon-r4.gltf",
    "description": "Agile reconnaissance quadcopter with a stabilised camera gimbal. Ideal for search-and-rescue, mapping and inspection missions. Excellent hover stability and quick, responsive handling."
  },
  {
    "id": 2,
    "name": "Hawk-X Fixed-Wing UAV",
    "type": "MILITARY",
    "weight": 24,
    "maxSpeed": 150,
    "batteryLife": 240,
    "modelUrl": "/assets/models/hawk-x.gltf",
    "description": "Long-endurance fixed-wing military UAV built for wide-area surveillance. Cannot hover: it needs continuous forward speed to stay airborne, which makes it very different to fly than a multirotor."
  },
  {
    "id": 3,
    "name": "Sparrow Tactical Micro-drone",
    "type": "MILITARY",
    "weight": 0.18,
    "maxSpeed": 45,
    "batteryLife": 22,
    "modelUrl": "/assets/models/sparrow-micro.gltf",
    "description": "Palm-sized tactical micro-drone for close-range indoor and urban scouting. Extremely light and nimble, but easily pushed around by wind and short on battery."
  },
  {
    "id": 4,
    "name": "Vortex FPV Racing Quad",
    "type": "CIVILIAN",
    "weight": 0.65,
    "maxSpeed": 140,
    "batteryLife": 9,
    "modelUrl": "/assets/models/vortex-fpv.gltf",
    "description": "Stripped-down racing quad built for speed and sharp turns. Huge power for its weight, but the battery only lasts a few minutes, so every lap counts."
  },
  {
    "id": 5,
    "name": "Atlas Heavy-lift Hexacopter",
    "type": "CIVILIAN",
    "weight": 18,
    "maxSpeed": 55,
    "batteryLife": 28,
    "modelUrl": "/assets/models/atlas-hex.gltf",
    "description": "Six-rotor workhorse that carries survey gear and cargo. It is slow to turn and slow to stop, but very steady in the air."
  },
  {
    "id": 6,
    "name": "Sentinel Patrol Octocopter",
    "type": "MILITARY",
    "weight": 9.5,
    "maxSpeed": 72,
    "batteryLife": 55,
    "modelUrl": "/assets/models/sentinel-octo.gltf",
    "description": "Eight-rotor patrol drone for perimeter watch and long observation flights. Heavy and stable, with endurance well above the small quads."
  },
  {
    "id": 7,
    "name": "Courier D6 Delivery Drone",
    "type": "CIVILIAN",
    "weight": 6.5,
    "maxSpeed": 60,
    "batteryLife": 35,
    "modelUrl": "/assets/models/courier-d6.gltf",
    "description": "Mid-size delivery drone for parcels across town. Predictable handling and a comfortable cruise speed make it a good first heavy drone."
  },
  {
    "id": 8,
    "name": "Terra AG-10 Crop Sprayer",
    "type": "CIVILIAN",
    "weight": 25,
    "maxSpeed": 28,
    "batteryLife": 18,
    "modelUrl": "/assets/models/terra-ag10.gltf",
    "description": "Large agricultural drone made to fly slow and low over fields. Very heavy and slow to respond, so plan every turn early."
  },
  {
    "id": 9,
    "name": "Skimmer Cinema Camera Drone",
    "type": "CIVILIAN",
    "weight": 4.2,
    "maxSpeed": 75,
    "batteryLife": 30,
    "modelUrl": "/assets/models/skimmer-cinema.gltf",
    "description": "Smooth, quiet camera platform for film and photography. Gentle control response and a solid battery for long takes."
  },
  {
    "id": 10,
    "name": "Raptor Rapid-Response Scout",
    "type": "MILITARY",
    "weight": 3.2,
    "maxSpeed": 110,
    "batteryLife": 25,
    "modelUrl": "/assets/models/raptor-scout.gltf",
    "description": "Fast scout for getting eyes on a location quickly. Quick to accelerate and agile, with a medium battery."
  }
];
