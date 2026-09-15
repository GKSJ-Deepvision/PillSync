/* eslint-disable react/no-unknown-property -- react-three-fiber's custom
   renderer maps props like `position`, `args`, `intensity`, `flatShading` to
   real three.js object properties; they aren't DOM/React-DOM attributes, so
   eslint-plugin-react's DOM-attribute check doesn't know about them. */
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  AGE_THEME,
  GENDER_SHAPE,
  prefersReducedMotion,
  sampleAngle,
  sampleTranslate,
} from "../lib/exerciseAnimation";
import { EXERCISE_POSES } from "../lib/exercisePoses";

// All lengths are in "3D units" (roughly meters) — independent of the 2D
// SVG's pixel constants in ExerciseFigure.jsx, but the same proportions.
const HIP_Y = 1.05;
const TORSO_LEN = 0.78;
const HEAD_R = 0.17;
const THIGH_LEN = 0.5;
const SHIN_LEN = 0.48;
const ARM_LEN = 0.58;
const LIMB_R = 0.09;

const deg2rad = THREE.MathUtils.degToRad;

/** Points the isometric camera at the figure's center once on mount. True
 * isometric (not just "diagonal perspective") comes from `orthographic`
 * on <Canvas camera>, not from this — this just aims it. */
function IsoCameraRig() {
  const { camera } = useThree();
  useMemo(() => camera.lookAt(0, 1.05, 0), [camera]);
  return null;
}

function Limb({ length, radius, color }) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow={false}>
      <capsuleGeometry args={[radius, Math.max(length - radius * 2, 0.05), 4, 8]} />
      <meshStandardMaterial color={color} flatShading roughness={0.6} />
    </mesh>
  );
}

function Figure3D({ exerciseId, ageGroup, gender }) {
  const pose = EXERCISE_POSES[exerciseId] || {};
  const theme = AGE_THEME[ageGroup] || AGE_THEME.young;
  const shape = GENDER_SHAPE[gender] || GENDER_SHAPE.male;
  const animate = useMemo(() => !prefersReducedMotion(), []);
  const speed = theme.speed || 1;
  const stoop = ageGroup === "old" ? theme.stoop || 0 : 0;

  const hipHalfWidth = shape.hipHalfWidth / 55;
  const shoulderHalfWidth = shape.shoulderHalfWidth / 55;
  const limbR = LIMB_R * (shape.strokeWidth / 6);

  const rootRef = useRef();
  const bodyTiltRef = useRef();
  const leftHipRef = useRef();
  const rightHipRef = useRef();
  const leftKneeRef = useRef();
  const rightKneeRef = useRef();
  const torsoRef = useRef();
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const t = animate ? state.clock.elapsedTime : 0;
    const a = (channel) => deg2rad(sampleAngle(channel, t, speed, animate));

    if (leftHipRef.current) leftHipRef.current.rotation.x = a(pose.leftHip);
    if (rightHipRef.current) rightHipRef.current.rotation.x = a(pose.rightHip);
    if (leftKneeRef.current) leftKneeRef.current.rotation.x = a(pose.leftKnee);
    if (rightKneeRef.current) rightKneeRef.current.rotation.x = a(pose.rightKnee);
    if (leftShoulderRef.current) leftShoulderRef.current.rotation.x = a(pose.leftShoulder);
    if (rightShoulderRef.current) rightShoulderRef.current.rotation.x = a(pose.rightShoulder);
    if (torsoRef.current) torsoRef.current.rotation.x = deg2rad(sampleAngle(pose.torsoLean, t, speed, animate) + stoop);
    if (headRef.current) headRef.current.rotation.x = a(pose.headTilt);
    if (bodyTiltRef.current) bodyTiltRef.current.rotation.x = deg2rad(pose.figureRotate || 0);

    if (rootRef.current) {
      const [bx, by] = pose.bob ? sampleTranslate(pose.bob, t, speed, animate) : [0, 0];
      const [sx, sy] = pose.sway ? sampleTranslate(pose.sway, t, speed, animate) : [0, 0];
      rootRef.current.position.set((sx + bx) / 60, -by / 60, sy / 60);
    }
  });

  return (
    <group ref={rootRef}>
      {/* Whole-body tilt (e.g. push-ups lying near-horizontal), pivoted at the hips */}
      <group ref={bodyTiltRef} position={[0, HIP_Y, 0]}>
        <group ref={leftHipRef} position={[-hipHalfWidth, 0, 0]}>
          <Limb length={THIGH_LEN} radius={limbR} color={theme.stroke} />
          <group ref={leftKneeRef} position={[0, -THIGH_LEN, 0]}>
            <Limb length={SHIN_LEN} radius={limbR * 0.9} color={theme.stroke} />
          </group>
        </group>

        <group ref={rightHipRef} position={[hipHalfWidth, 0, 0]}>
          <Limb length={THIGH_LEN} radius={limbR} color={theme.stroke} />
          <group ref={rightKneeRef} position={[0, -THIGH_LEN, 0]}>
            <Limb length={SHIN_LEN} radius={limbR * 0.9} color={theme.stroke} />
          </group>
        </group>

        <group ref={torsoRef}>
          <mesh position={[0, TORSO_LEN / 2, 0]}>
            <capsuleGeometry args={[limbR * 1.3, Math.max(TORSO_LEN - limbR * 2, 0.1), 4, 8]} />
            <meshStandardMaterial color={theme.stroke} flatShading roughness={0.6} />
          </mesh>

          <group ref={leftShoulderRef} position={[-shoulderHalfWidth, TORSO_LEN, 0]}>
            <Limb length={ARM_LEN} radius={limbR * 0.8} color={theme.joint} />
          </group>
          <group ref={rightShoulderRef} position={[shoulderHalfWidth, TORSO_LEN, 0]}>
            <Limb length={ARM_LEN} radius={limbR * 0.8} color={theme.joint} />
          </group>

          <group ref={headRef} position={[0, TORSO_LEN, 0]}>
            <mesh position={[0, HEAD_R + 0.03, 0]}>
              <sphereGeometry args={[HEAD_R, 12, 10]} />
              <meshStandardMaterial color={theme.fill} flatShading roughness={0.5} />
            </mesh>
            {shape.hasHair && (
              <mesh position={[0, HEAD_R + 0.06, -HEAD_R * 0.7]}>
                <sphereGeometry args={[HEAD_R * 0.55, 8, 8]} />
                <meshStandardMaterial color={theme.stroke} flatShading roughness={0.7} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

function Ground({ color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <circleGeometry args={[1.15, 24]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

/**
 * Isometric 3D replacement for <ExerciseFigure> (SVG stick figure). Same
 * props, same pose data source (EXERCISE_POSES) — only the renderer differs,
 * so every exercise's animation "just works" here without redefining poses.
 */
export default function ExerciseFigure3D({
  exerciseId,
  ageGroup = "young",
  gender = "male",
  size = 140,
  showGround = true,
  className = "",
}) {
  const theme = AGE_THEME[ageGroup] || AGE_THEME.young;

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`3D animated demonstration of ${exerciseId.replaceAll("_", " ")}`}
    >
      <Canvas
        orthographic
        camera={{ position: [3.4, 3, 3.4], zoom: size * 0.42, near: 0.1, far: 20 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <IsoCameraRig />
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 2]} intensity={0.9} />
        <directionalLight position={[-3, 2, -2]} intensity={0.25} />
        <Suspense fallback={null}>
          <Figure3D exerciseId={exerciseId} ageGroup={ageGroup} gender={gender} />
        </Suspense>
        {showGround && <Ground color={theme.ground} />}
      </Canvas>
    </div>
  );
}
