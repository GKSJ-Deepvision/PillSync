import { useMemo } from "react";
import {
  AGE_THEME,
  GENDER_SHAPE,
  buildRotateValues,
  buildTranslateValues,
  evenKeyTimes,
  prefersReducedMotion,
} from "../lib/exerciseAnimation";
import { EXERCISE_POSES } from "../lib/exercisePoses";

const HIP_Y = 150;
const SHOULDER_Y = 70;
const NECK_Y = 66;
const HEAD_Y = 50;
const HEAD_R = 16;
const THIGH_LEN = 45;
const SHIN_LEN = 45;
const ARM_LEN = 55;
const CENTER_X = 100;

/** Wraps children in a rotating <g> driven by a pose channel, or applies a
 * static rotation, or renders children unrotated if the channel is absent. */
function RotateGroup({ channel, pivotX, pivotY, extraOffset = 0, animate, children }) {
  if (!channel) {
    return extraOffset ? (
      <g transform={`rotate(${extraOffset} ${pivotX} ${pivotY})`}>{children}</g>
    ) : (
      <g>{children}</g>
    );
  }
  if (channel.static !== undefined || !animate) {
    const angle = (channel.static ?? channel.values?.[0] ?? 0) + extraOffset;
    return <g transform={`rotate(${angle} ${pivotX} ${pivotY})`}>{children}</g>;
  }
  const values = channel.values.map((v) => v + extraOffset);
  return (
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={buildRotateValues(values, pivotX, pivotY)}
        keyTimes={evenKeyTimes(values.length)}
        dur={`${channel.dur}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines={values.slice(1).map(() => "0.42 0 0.58 1").join(";")}
      />
      {children}
    </g>
  );
}

export default function ExerciseFigure({
  exerciseId,
  ageGroup = "young",
  gender = "male",
  size = 140,
  showGround = true,
  className = "",
}) {
  const pose = EXERCISE_POSES[exerciseId] || {};
  const theme = AGE_THEME[ageGroup] || AGE_THEME.young;
  const shape = GENDER_SHAPE[gender] || GENDER_SHAPE.male;
  const animate = useMemo(() => !prefersReducedMotion(), []);
  const speed = theme.speed || 1;

  const scaleDur = (ch) => (ch ? { ...ch, dur: (ch.dur || 1) * speed } : ch);

  const leftHip = scaleDur(pose.leftHip);
  const rightHip = scaleDur(pose.rightHip);
  const leftKnee = scaleDur(pose.leftKnee);
  const rightKnee = scaleDur(pose.rightKnee);
  const leftShoulder = scaleDur(pose.leftShoulder);
  const rightShoulder = scaleDur(pose.rightShoulder);
  const torsoLean = scaleDur(pose.torsoLean);
  const headTilt = scaleDur(pose.headTilt);
  const stoop = ageGroup === "old" ? theme.stoop || 0 : 0;

  const hipXL = CENTER_X - shape.hipHalfWidth;
  const hipXR = CENTER_X + shape.hipHalfWidth;
  const shoulderXL = CENTER_X - shape.shoulderHalfWidth;
  const shoulderXR = CENTER_X + shape.shoulderHalfWidth;
  const sw = shape.strokeWidth;

  let bobAttr = null;
  if (pose.bob) {
    bobAttr = animate ? (
      <animateTransform
        attributeName="transform"
        type="translate"
        values={buildTranslateValues(pose.bob.values)}
        keyTimes={evenKeyTimes(pose.bob.values.length)}
        dur={`${pose.bob.dur * speed}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines={pose.bob.values.slice(1).map(() => "0.42 0 0.58 1").join(";")}
      />
    ) : null;
  }
  let swayAttr = null;
  if (pose.sway) {
    swayAttr = animate ? (
      <animateTransform
        attributeName="transform"
        type="translate"
        values={buildTranslateValues(pose.sway.values)}
        keyTimes={evenKeyTimes(pose.sway.values.length)}
        dur={`${pose.sway.dur * speed}s`}
        repeatCount="indefinite"
      />
    ) : null;
  }

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Animated demonstration of ${exerciseId.replaceAll("_", " ")}`}
    >
      {showGround && <line x1="20" y1="248" x2="180" y2="248" stroke={theme.ground} strokeWidth="4" strokeLinecap="round" />}
      {pose.props?.chair && (
        <g stroke={theme.ground} strokeWidth="6" strokeLinecap="round" fill="none">
          <line x1="140" y1="150" x2="140" y2="246" />
          <line x1="70" y1="150" x2="140" y2="150" />
          <line x1="70" y1="150" x2="70" y2="180" />
        </g>
      )}

      <g>
        {bobAttr}
        <g>
          {swayAttr}
          <g transform={pose.figureRotate ? `rotate(${pose.figureRotate} 100 150)` : undefined}>
            {/* Legs — attach directly at the hip pivot, independent of torso lean */}
            <RotateGroup channel={leftHip} pivotX={hipXL} pivotY={HIP_Y} animate={animate}>
              <line x1={hipXL} y1={HIP_Y} x2={hipXL} y2={HIP_Y + THIGH_LEN} stroke={theme.stroke} strokeWidth={sw} strokeLinecap="round" />
              <RotateGroup channel={leftKnee} pivotX={hipXL} pivotY={HIP_Y + THIGH_LEN} animate={animate}>
                <line x1={hipXL} y1={HIP_Y + THIGH_LEN} x2={hipXL} y2={HIP_Y + THIGH_LEN + SHIN_LEN} stroke={theme.stroke} strokeWidth={sw} strokeLinecap="round" />
              </RotateGroup>
              <circle cx={hipXL} cy={HIP_Y} r={sw * 0.7} fill={theme.joint} />
            </RotateGroup>

            <RotateGroup channel={rightHip} pivotX={hipXR} pivotY={HIP_Y} animate={animate}>
              <line x1={hipXR} y1={HIP_Y} x2={hipXR} y2={HIP_Y + THIGH_LEN} stroke={theme.stroke} strokeWidth={sw} strokeLinecap="round" />
              <RotateGroup channel={rightKnee} pivotX={hipXR} pivotY={HIP_Y + THIGH_LEN} animate={animate}>
                <line x1={hipXR} y1={HIP_Y + THIGH_LEN} x2={hipXR} y2={HIP_Y + THIGH_LEN + SHIN_LEN} stroke={theme.stroke} strokeWidth={sw} strokeLinecap="round" />
              </RotateGroup>
              <circle cx={hipXR} cy={HIP_Y} r={sw * 0.7} fill={theme.joint} />
            </RotateGroup>

            {/* Upper body — torso, head and arms rotate together around the hips (torso lean / senior stoop) */}
            <RotateGroup channel={torsoLean} pivotX={CENTER_X} pivotY={HIP_Y} extraOffset={stoop} animate={animate}>
              <line x1={CENTER_X} y1={HIP_Y} x2={CENTER_X} y2={NECK_Y} stroke={theme.stroke} strokeWidth={sw} strokeLinecap="round" />

              <RotateGroup channel={leftShoulder} pivotX={shoulderXL} pivotY={SHOULDER_Y} animate={animate}>
                <line x1={shoulderXL} y1={SHOULDER_Y} x2={shoulderXL} y2={SHOULDER_Y + ARM_LEN} stroke={theme.stroke} strokeWidth={sw - 1} strokeLinecap="round" />
              </RotateGroup>
              <RotateGroup channel={rightShoulder} pivotX={shoulderXR} pivotY={SHOULDER_Y} animate={animate}>
                <line x1={shoulderXR} y1={SHOULDER_Y} x2={shoulderXR} y2={SHOULDER_Y + ARM_LEN} stroke={theme.stroke} strokeWidth={sw - 1} strokeLinecap="round" />
              </RotateGroup>

              <RotateGroup channel={headTilt} pivotX={CENTER_X} pivotY={NECK_Y} animate={animate}>
                {shape.hasHair && (
                  <path
                    d={`M ${CENTER_X - HEAD_R} ${HEAD_Y - 2} Q ${CENTER_X - HEAD_R - 6} ${HEAD_Y + 22} ${CENTER_X - HEAD_R + 4} ${HEAD_Y + 30} M ${CENTER_X + HEAD_R} ${HEAD_Y - 2} Q ${CENTER_X + HEAD_R + 6} ${HEAD_Y + 22} ${CENTER_X + HEAD_R - 4} ${HEAD_Y + 30}`}
                    stroke={theme.stroke}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
                <circle cx={CENTER_X} cy={HEAD_Y} r={HEAD_R} fill={theme.fill} stroke={theme.stroke} strokeWidth={sw - 1} />
              </RotateGroup>
            </RotateGroup>
          </g>
        </g>
      </g>
    </svg>
  );
}
