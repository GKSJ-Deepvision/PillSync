/**
 * One pose config per exercise. `<ExerciseFigure>` reads these channels and
 * turns them into <animateTransform> elements. Every channel is optional:
 * - { values: [...], dur } animates a rotation (or translate, for `bob`/`sway`)
 *   back and forth forever, `dur` in seconds at 1x speed (age themes scale it).
 * - { static: number } holds a fixed angle with no animation.
 * - omitted entirely -> joint stays at its neutral (0deg) position.
 *
 * Rotation channels (leftShoulder, rightShoulder, leftHip, rightHip,
 * leftKnee, rightKnee, torsoLean, headTilt) are degrees around that joint.
 * `bob` and `sway` are whole-figure translate channels (px).
 */
export const EXERCISE_POSES = {
  brisk_walk: {
    dur: 1.1,
    leftHip: { values: [22, -22, 22], dur: 1.1 },
    rightHip: { values: [-22, 22, -22], dur: 1.1 },
    leftKnee: { values: [10, 45, 10], dur: 1.1 },
    rightKnee: { values: [45, 10, 45], dur: 1.1 },
    leftShoulder: { values: [-25, 25, -25], dur: 1.1 },
    rightShoulder: { values: [25, -25, 25], dur: 1.1 },
    bob: { values: [[0, 0], [0, -4], [0, 0]], dur: 1.1 },
  },
  jumping_jacks: {
    dur: 0.8,
    leftHip: { values: [0, 25, 0], dur: 0.8 },
    rightHip: { values: [0, -25, 0], dur: 0.8 },
    leftShoulder: { values: [10, -165, 10], dur: 0.8 },
    rightShoulder: { values: [-10, 165, -10], dur: 0.8 },
    bob: { values: [[0, 0], [0, -14], [0, 0]], dur: 0.8 },
  },
  squats: {
    dur: 1.6,
    leftHip: { values: [0, 45, 0], dur: 1.6 },
    rightHip: { values: [0, -45, 0], dur: 1.6 },
    leftKnee: { values: [0, 75, 0], dur: 1.6 },
    rightKnee: { values: [0, 75, 0], dur: 1.6 },
    leftShoulder: { static: -85 },
    rightShoulder: { static: 85 },
    bob: { values: [[0, 0], [0, 22], [0, 0]], dur: 1.6 },
  },
  lunges: {
    dur: 1.6,
    leftHip: { values: [-30, 30, -30], dur: 1.6 },
    rightHip: { values: [30, -30, 30], dur: 1.6 },
    leftKnee: { values: [10, 80, 10], dur: 1.6 },
    rightKnee: { values: [80, 10, 80], dur: 1.6 },
    leftShoulder: { static: -20 },
    rightShoulder: { static: 20 },
    bob: { values: [[0, 0], [0, 14], [0, 0]], dur: 1.6 },
  },
  push_ups: {
    dur: 1.3,
    figureRotate: -80, // lie the whole figure near-horizontal
    leftShoulder: { values: [70, 20, 70], dur: 1.3 },
    rightShoulder: { values: [-70, -20, -70], dur: 1.3 },
    leftKnee: { static: 4 },
    rightKnee: { static: 4 },
    bob: { values: [[0, 0], [0, 10], [0, 0]], dur: 1.3 },
  },
  plank_hold: {
    dur: 2.2,
    figureRotate: -80,
    leftShoulder: { static: 70 },
    rightShoulder: { static: -70 },
    bob: { values: [[0, 0], [0, 2], [0, 0]], dur: 2.2 }, // subtle "hold, breathe" wobble
  },
  wall_pushups: {
    dur: 1.6,
    torsoLean: { static: 18 },
    leftShoulder: { values: [40, 15, 40], dur: 1.6 },
    rightShoulder: { values: [-40, -15, -40], dur: 1.6 },
    bob: { values: [[0, 0], [3, 0], [0, 0]], dur: 1.6 },
  },
  chair_stand_sit: {
    dur: 2.2,
    props: { chair: true },
    leftHip: { values: [0, 90, 0], dur: 2.2 },
    rightHip: { values: [0, -90, 0], dur: 2.2 },
    leftKnee: { values: [0, 95, 0], dur: 2.2 },
    rightKnee: { values: [0, 95, 0], dur: 2.2 },
    leftShoulder: { static: -25 },
    rightShoulder: { static: 25 },
    bob: { values: [[0, 0], [0, 30], [0, 0]], dur: 2.2 },
  },
  seated_marching: {
    dur: 1.4,
    props: { chair: true, seated: true },
    leftHip: { values: [0, -55, 0], dur: 1.4 },
    rightHip: { values: [0, 55, 0], dur: 1.4 },
    leftKnee: { values: [90, 20, 90], dur: 1.4 },
    rightKnee: { values: [20, 90, 20], dur: 1.4 },
    leftShoulder: { values: [-10, 10, -10], dur: 1.4 },
    rightShoulder: { values: [10, -10, 10], dur: 1.4 },
  },
  standing_hamstring_stretch: {
    dur: 3,
    torsoLean: { static: 55 },
    leftHip: { static: -10 },
    leftKnee: { static: 4 },
    rightKnee: { static: 8 },
    leftShoulder: { static: 40 },
    rightShoulder: { static: 40 },
    bob: { values: [[0, 0], [0, 3], [0, 0]], dur: 3 },
  },
  cat_cow_stretch: {
    dur: 2.4,
    torsoLean: { values: [70, 95, 70], dur: 2.4 },
    headTilt: { values: [-15, 20, -15], dur: 2.4 },
    leftShoulder: { static: 80 },
    rightShoulder: { static: -80 },
    leftKnee: { static: 90 },
    rightKnee: { static: 90 },
  },
  neck_shoulder_stretch: {
    dur: 4,
    headTilt: { values: [0, 22, 0, -22, 0], dur: 4 },
    leftShoulder: { static: -6 },
    rightShoulder: { static: 6 },
  },
  tree_pose_balance: {
    dur: 3.2,
    sway: { values: [[0, 0], [3, 0], [0, 0], [-3, 0], [0, 0]], dur: 3.2 },
    leftHip: { static: -40 },
    leftKnee: { static: 110 },
    leftShoulder: { static: -170 },
    rightShoulder: { static: 170 },
  },
  single_leg_stand: {
    dur: 3.2,
    sway: { values: [[0, 0], [2, 0], [0, 0], [-2, 0], [0, 0]], dur: 3.2 },
    leftHip: { static: -18 },
    leftKnee: { static: 30 },
    leftShoulder: { static: -70 },
    rightShoulder: { static: 70 },
  },
};
