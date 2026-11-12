import { Grid } from '@react-three/drei';

export default function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#5b7a4a" roughness={1} />
      </mesh>

      {/* helps you feel speed and altitude */}
      <Grid
        position={[0, 0.01, 0]}
        args={[2000, 2000]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#4a6a3c"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3c5a30"
        fadeDistance={150}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* landing pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[3, 48]} />
        <meshStandardMaterial color="#d9dde2" />
      </mesh>
    </>
  );
}
