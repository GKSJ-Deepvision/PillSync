/**
 * Static exercise library, grouped into sections by category. Each entry's
 * `id` also keys into EXERCISE_POSES (lib/exercisePoses.js) for the animation
 * and is the same id the AI diet/exercise planner (Groq) is given as its
 * allowed vocabulary, so anything it assigns is guaranteed to render.
 */
export const CATEGORIES = [
  { key: "cardio", label: "Cardio", blurb: "Gets your heart rate up." },
  { key: "strength", label: "Strength", blurb: "Builds muscle and bone density." },
  { key: "flexibility", label: "Flexibility & Mobility", blurb: "Loosens joints, eases stiffness." },
  { key: "balance", label: "Balance", blurb: "Improves stability, lowers fall risk." },
];

export const EXERCISES = [
  {
    id: "brisk_walk",
    name: "Brisk Walk / March in Place",
    category: "cardio",
    ageGroups: ["young", "middle", "old"],
    seniorFriendly: true,
    equipment: "None",
    description: "A steady, rhythmic walk that raises your heart rate without straining joints.",
    benefits: [
      "Improves cardiovascular endurance",
      "Low-impact — easy on knees and hips",
      "Great warm-up before any other routine",
    ],
    steps: [
      "Stand tall, shoulders relaxed, core gently engaged.",
      "Swing your arms naturally and take steady, even steps.",
      "Keep a pace where you can still hold a conversation.",
      "Continue for 5–20 minutes depending on your fitness level.",
    ],
  },
  {
    id: "jumping_jacks",
    name: "Jumping Jacks",
    category: "cardio",
    ageGroups: ["young", "middle"],
    equipment: "None",
    description: "A full-body cardio move that opens and closes the arms and legs in a jump.",
    benefits: ["Fast heart-rate elevation", "Works arms, legs and core together", "Great for interval training"],
    steps: [
      "Start standing with feet together, arms at your sides.",
      "Jump your feet out wide while raising your arms overhead.",
      "Jump back to the start position.",
      "Repeat at a steady, controlled pace for 20–45 seconds.",
    ],
  },
  {
    id: "squats",
    name: "Bodyweight Squats",
    category: "strength",
    ageGroups: ["young", "middle"],
    equipment: "None",
    description: "A hip-hinge and knee-bend movement that builds lower-body strength.",
    benefits: ["Strengthens quads, glutes and hamstrings", "Improves everyday movements like sitting/standing", "Builds core stability"],
    steps: [
      "Stand with feet shoulder-width apart, chest up.",
      "Push your hips back and bend your knees like sitting into a chair.",
      "Go down until thighs are roughly parallel to the floor (or as far as comfortable).",
      "Push through your heels to stand back up.",
    ],
  },
  {
    id: "lunges",
    name: "Forward Lunges",
    category: "strength",
    ageGroups: ["young", "middle"],
    equipment: "None",
    description: "An alternating single-leg strength move that also challenges balance.",
    benefits: ["Builds unilateral leg strength", "Improves balance and coordination", "Engages glutes and core"],
    steps: [
      "Stand tall, step one foot forward into a long stride.",
      "Lower your hips until both knees are bent near 90°.",
      "Push back through the front foot to return to standing.",
      "Alternate legs for the set.",
    ],
  },
  {
    id: "push_ups",
    name: "Push-Ups",
    category: "strength",
    ageGroups: ["young", "middle"],
    equipment: "None (or knees-down modification)",
    description: "A classic upper-body press performed face-down, supported by hands and toes (or knees).",
    benefits: ["Strengthens chest, shoulders and triceps", "Engages the core to keep the body straight", "Scales easily via knee push-ups"],
    steps: [
      "Start in a plank with hands slightly wider than shoulders.",
      "Keep your body in one straight line from head to heels.",
      "Bend your elbows to lower your chest toward the floor.",
      "Push back up to the starting position without sagging your hips.",
    ],
  },
  {
    id: "plank_hold",
    name: "Plank Hold",
    category: "strength",
    ageGroups: ["young", "middle"],
    equipment: "None",
    description: "An isometric hold that builds core endurance without any movement.",
    benefits: ["Strengthens deep core muscles", "Improves posture", "No joint strain from repetitive motion"],
    steps: [
      "Rest on forearms and toes, elbows under shoulders.",
      "Keep your body in a straight line — no sagging hips, no piked hips.",
      "Breathe steadily and hold for 15–45 seconds.",
      "Rest and repeat for 2–3 rounds.",
    ],
  },
  {
    id: "wall_pushups",
    name: "Wall Push-Ups",
    category: "strength",
    ageGroups: ["old", "middle"],
    seniorFriendly: true,
    equipment: "A wall",
    description: "A gentler, standing version of the push-up that's easy on wrists and shoulders.",
    benefits: ["Builds upper-body strength safely", "No floor get-up/get-down required", "Great joint-friendly starting point"],
    steps: [
      "Stand an arm's length from a wall, palms flat against it at shoulder height.",
      "Keep your body straight and lean in by bending your elbows.",
      "Push back to the starting position.",
      "Repeat 8–12 times at a comfortable pace.",
    ],
  },
  {
    id: "chair_stand_sit",
    name: "Chair Sit-to-Stand",
    category: "strength",
    ageGroups: ["old", "middle"],
    seniorFriendly: true,
    equipment: "A sturdy chair",
    description: "A functional squat using a chair as a safety guide and range-of-motion target.",
    benefits: ["Builds the exact strength used to stand up from a seat", "Reduces fall risk", "Safe way to load the legs for older adults"],
    steps: [
      "Sit toward the front edge of a sturdy chair, feet flat on the floor.",
      "Lean slightly forward and press through your feet to stand up.",
      "Stand tall for a moment, then slowly lower back down with control.",
      "Use your arms on the armrests for extra support if needed.",
    ],
  },
  {
    id: "seated_marching",
    name: "Seated Marching",
    category: "cardio",
    ageGroups: ["old"],
    seniorFriendly: true,
    equipment: "A chair",
    description: "A seated cardio movement that's safe for anyone with balance concerns.",
    benefits: ["Raises heart rate with zero fall risk", "Improves hip mobility and circulation", "Can be done anywhere with a chair"],
    steps: [
      "Sit tall toward the front of a chair, feet flat on the floor.",
      "Lift one knee up toward your chest, then lower it.",
      "Alternate legs in a steady marching rhythm.",
      "Swing your arms gently to add an upper-body element.",
    ],
  },
  {
    id: "standing_hamstring_stretch",
    name: "Standing Hamstring Stretch",
    category: "flexibility",
    ageGroups: ["young", "middle", "old"],
    seniorFriendly: true,
    equipment: "None",
    description: "A gentle forward hinge that stretches the back of the legs.",
    benefits: ["Eases tight hamstrings and lower back", "Improves hip flexibility", "Good cool-down after cardio"],
    steps: [
      "Stand tall, extend one leg slightly forward with heel on the floor.",
      "Keep your back flat and hinge forward from the hips.",
      "Hold the gentle stretch for 20–30 seconds without bouncing.",
      "Switch legs and repeat.",
    ],
  },
  {
    id: "cat_cow_stretch",
    name: "Cat-Cow Stretch",
    category: "flexibility",
    ageGroups: ["young", "middle"],
    equipment: "A mat",
    description: "A flowing spinal stretch performed on hands and knees.",
    benefits: ["Mobilizes the entire spine", "Relieves back tension", "Warms up the core before other movement"],
    steps: [
      "Start on hands and knees, wrists under shoulders, knees under hips.",
      "Inhale, drop your belly and lift your chest and tailbone (cow).",
      "Exhale, round your spine toward the ceiling and tuck your chin (cat).",
      "Flow slowly between the two for 6–10 breaths.",
    ],
  },
  {
    id: "neck_shoulder_stretch",
    name: "Neck & Shoulder Stretch",
    category: "flexibility",
    ageGroups: ["old", "middle"],
    seniorFriendly: true,
    equipment: "None",
    description: "A slow, gentle stretch to release tension built up from sitting or poor posture.",
    benefits: ["Eases neck and shoulder stiffness", "Very low intensity — safe for every age", "Can be done seated or standing"],
    steps: [
      "Sit or stand tall with shoulders relaxed.",
      "Slowly tilt your head toward one shoulder until you feel a gentle stretch.",
      "Hold for 15–20 seconds, breathing normally.",
      "Return to center and repeat on the other side.",
    ],
  },
  {
    id: "tree_pose_balance",
    name: "Tree Pose",
    category: "balance",
    ageGroups: ["young", "middle"],
    equipment: "None",
    description: "A classic standing yoga balance pose on one leg.",
    benefits: ["Trains single-leg balance and ankle stability", "Builds focus and calm", "Strengthens the standing leg"],
    steps: [
      "Stand tall and shift your weight onto one leg.",
      "Place the sole of the other foot on your calf or inner thigh (not on the knee joint).",
      "Bring your palms together at your chest or raise your arms overhead.",
      "Hold for 20–30 seconds, then switch sides.",
    ],
  },
  {
    id: "single_leg_stand",
    name: "Single-Leg Stand (with support)",
    category: "balance",
    ageGroups: ["old"],
    seniorFriendly: true,
    equipment: "A chair or counter to hold if needed",
    description: "A simple, safer balance drill to build stability for daily life.",
    benefits: ["Directly reduces fall risk", "Strengthens ankle and hip stabilizers", "Can be done next to a counter for safety"],
    steps: [
      "Stand near a chair or counter you can hold if needed.",
      "Shift your weight onto one leg and lift the other slightly off the floor.",
      "Hold for 10–15 seconds, using your arms out to the side for balance.",
      "Lower down and switch legs.",
    ],
  },
];

export function getExercisesForAgeGroup(ageGroup) {
  return EXERCISES.filter((e) => e.ageGroups.includes(ageGroup));
}

export function getExerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}
