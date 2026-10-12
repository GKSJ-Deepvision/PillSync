/**
 * PillSync Knowledge Base & Clinical Care AI Assistant
 * Provides intelligent, context-aware responses grounded in real patient data.
 */

import { getScopedStorage } from './userStorage';

export const PILLSYNC_DISCLAIMER =
  'PillSync is an intelligent reminder and medication tracking platform and does not replace professional medical advice. For emergencies, please call 911 or your local emergency services immediately.';

function getUserActiveMeds() {
  return getScopedStorage('pillsync_patient_medications', []);
}

/**
 * Returns a response object { text: string, suggestions: string[] }
 * or works backwards-compatibly with code expecting text.
 */
export function getChatbotResponse(userQuery, context = {}) {
  if (!userQuery || typeof userQuery !== 'string') {
    return {
      text: 'Please ask a question about your medications, schedule, reminders, or adherence.',
      suggestions: ['What medicines do I take?', 'When is my next dose?', 'Check my adherence'],
    };
  }

  const query = userQuery.trim();
  const normalized = query.toLowerCase();

  // Extract contextual data
  const userName =
    context.user?.name ||
    context.user?.first_name ||
    (context.user?.email ? context.user.email.split('@')[0] : 'there');

  const meds =
    context.medications && context.medications.length > 0
      ? context.medications
      : getUserActiveMeds();

  const doses = Array.isArray(context.doses) ? context.doses : [];
  const takenDoses = doses.filter((d) => d.status === 'taken');
  const pendingDoses = doses.filter((d) => d.status === 'pending');

  // Helper to format response
  const reply = (text, suggestions = []) => ({
    text: text.trim(),
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [
            'What medicines do I take?',
            'When is my next dose?',
            'Check my adherence',
            'What if I miss a dose?',
          ],
    toString() {
      return this.text;
    },
  });

  // ── 1. GREETINGS & PLEASANTRIES ──
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|sup|yo|hi there|hello there)\b/i.test(
      normalized
    ) ||
    normalized === 'hi' ||
    normalized === 'hello' ||
    normalized === 'hey'
  ) {
    return reply(
      `Hello ${userName}! 👋 I am your PillSync Clinical Care AI Assistant.\n\nI can help you monitor your medication schedule, look up dosage instructions, check your adherence score, or guide you on missed doses.\n\nWhat would you like to check today?`,
      [
        'What medicines do I take?',
        'When is my next dose?',
        'Check my adherence',
        'What if I miss a dose?',
      ]
    );
  }

  // ── 2. "WHO ARE YOU" / "WHAT CAN YOU DO" / "HELP" ──
  if (
    normalized.includes('who are you') ||
    normalized.includes('what can you do') ||
    normalized.includes('what are you') ||
    normalized.includes('how can you help') ||
    normalized.includes('help me') ||
    normalized === 'help'
  ) {
    return reply(
      `I am the PillSync Clinical Support & AI Assistant 🩺\n\nHere is how I assist you:\n• 💊 Review your scheduled prescriptions & timing\n• ⏰ Alert you about upcoming & pending doses\n• 📊 Calculate your real-time adherence rate\n• 🛡️ Explain what to do if you miss or snooze a dose\n• 👨‍⚕️ Coordinate updates with your caregiver care team\n• 🔍 Look up common medication interactions and food instructions`,
      [
        'What medicines do I take?',
        'When is my next dose?',
        'Check my adherence',
        'Contact caregiver',
      ]
    );
  }

  // ── 3. TODAY'S MEDICATIONS & ACTIVE REGIMEN ──
  if (
    normalized.includes('medicines today') ||
    normalized.includes('what medicines') ||
    normalized.includes('take today') ||
    normalized.includes('today schedule') ||
    normalized.includes('my medicines') ||
    normalized.includes('my meds') ||
    normalized.includes('what pills') ||
    normalized.includes('prescription list') ||
    normalized.includes('what do i take') ||
    normalized.includes('active meds') ||
    normalized.includes('current medications')
  ) {
    if (!meds || meds.length === 0) {
      return reply(
        `You currently have no scheduled medications in your active regimen.\n\n💡 To add a medication:\n1. Click the "+ Add Medication" button on your Dashboard or Prescriptions tab.\n2. Or click "Prescription Scanner" to scan an Rx label automatically.`,
        ['How do I add a medication?', 'When is my next dose?', 'Contact caregiver']
      );
    }

    const medLines = meds
      .map(
        (m, idx) =>
          `${idx + 1}. ${m.name} ${m.dosage || ''} — ${m.frequency || 'Daily'} (${m.instructions || 'Take as directed'})`
      )
      .join('\n');

    const statusNote =
      doses.length > 0
        ? `\n\n📌 Today's Progress: ${takenDoses.length} of ${doses.length} doses logged as taken.`
        : '';

    return reply(
      `Here is your active medication care plan:\n\n${medLines}${statusNote}\n\nYou can click "Take Dose" directly on your Dashboard or Reminders page whenever you take your dose!`,
      ['When is my next dose?', 'Check my adherence', 'What if I miss a dose?']
    );
  }

  // ── 4. UPCOMING / NEXT DOSE ──
  if (
    normalized.includes('next dose') ||
    normalized.includes('next pill') ||
    normalized.includes('when is my next') ||
    normalized.includes('upcoming dose') ||
    normalized.includes('next medicine') ||
    normalized.includes('what time')
  ) {
    if (pendingDoses.length > 0) {
      const next = pendingDoses[0];
      return reply(
        `⏰ Your next scheduled dose is:\n\n• Medication: ${next.medName || next.name || 'Prescription dose'}\n• Dosage: ${next.dosage || 'Standard dose'}\n• Scheduled Time: ${next.time || 'Upcoming window'}\n• Status: Pending intake\n\nOnce you have taken it, tap "Take Dose" to record your timestamp!`,
        ['Mark dose as taken', 'What if I miss a dose?', 'What happens when I snooze?']
      );
    } else if (doses.length > 0 && takenDoses.length === doses.length) {
      return reply(
        `🎉 Excellent! All ${doses.length} scheduled doses for today have already been completed and logged as taken.\n\nYour adherence streak is fully up to date!`,
        ['Check my adherence', 'What medicines do I take?', 'Contact caregiver']
      );
    } else {
      return reply(
        `You have no pending medication doses on your schedule right now.\n\nCheck your Prescriptions tab to review or add to your regimen.`,
        ['What medicines do I take?', 'How do I add a medication?']
      );
    }
  }

  // ── 5. ADHERENCE & COMPLIANCE SCORE ──
  if (
    normalized.includes('adherence') ||
    normalized.includes('percentage') ||
    normalized.includes('score') ||
    normalized.includes('compliance') ||
    normalized.includes('streak') ||
    normalized.includes('progress') ||
    normalized.includes('how am i doing') ||
    normalized.includes('rate')
  ) {
    if (doses.length === 0 && meds.length === 0) {
      return reply(
        `You currently have no active prescriptions logged. Once you schedule and log medication intakes, your clinical adherence score will calculate dynamically in real time!`,
        ['How do I add a medication?', 'What medicines do I take?']
      );
    }

    const total = doses.length || meds.length;
    const taken = takenDoses.length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

    let evalMessage;
    if (rate >= 90) {
      evalMessage =
        '🌟 Outstanding adherence! Consistency keeps therapeutic blood levels stable and prevents complications.';
    } else if (rate >= 70) {
      evalMessage =
        '👍 Good progress! Remember to log your remaining doses today to keep your streak going.';
    } else {
      evalMessage =
        '⚠️ Your adherence rate is below target. Consistent intake ensures your treatment remains effective. Reach out to your caregiver if you need assistance.';
    }

    return reply(
      `📊 Adherence Telemetry Summary:\n\n• Today's Score: ${rate}%\n• Doses Completed: ${taken} of ${total}\n• Status: ${evalMessage}\n\nVisit the Adherence Analytics page to see your 30-day adherence graph and caregiver reports.`,
      ['When is my next dose?', 'What if I miss a dose?', 'Contact caregiver']
    );
  }

  // ── 6. MISSED DOSE ADVISORY ──
  if (
    normalized.includes('miss') ||
    normalized.includes('missed') ||
    normalized.includes('forgot') ||
    normalized.includes('forget') ||
    normalized.includes('skipped') ||
    normalized.includes('skip') ||
    normalized.includes('late')
  ) {
    return reply(
      `📋 Clinical Guidance for a Missed Dose:\n\n1. ⚠️ DO NOT double up doses: Never take two doses together to make up for a missed one unless specifically instructed by your physician.\n2. ⏱️ Check the time: If it is close to your next scheduled dose, skip the missed dose and resume your normal schedule.\n3. 📝 Log in PillSync: Click "Missed" or note it in the app so your caregiver care team has accurate records.\n4. 💊 Take with water: If you take it within a short window, take it with a full glass of water.`,
      ['What happens when I snooze?', 'Contact caregiver', 'When is my next dose?']
    );
  }

  // ── 7. SNOOZE FEATURE ──
  if (
    normalized.includes('snooze') ||
    normalized.includes('delay') ||
    normalized.includes('remind me later') ||
    normalized.includes('pause reminder')
  ) {
    return reply(
      `🔔 How the Snooze Feature Works:\n\nWhen you click "Snooze" on a dose reminder:\n• The alert is temporarily paused for 30 minutes.\n• PillSync will ping you again with a secondary reminder so you don't forget.\n• If you are away from home or waiting for a meal, Snooze keeps your adherence on track without marking the dose as missed!`,
      ['What if I miss a dose?', 'When is my next dose?', 'Mark dose as taken']
    );
  }

  // ── 8. LOG / MARK AS TAKEN ──
  if (
    normalized.includes('mark as taken') ||
    normalized.includes('how to mark') ||
    normalized.includes('take dose') ||
    normalized.includes('log dose') ||
    normalized.includes('record dose') ||
    normalized.includes('took my pill') ||
    normalized.includes('took medicine')
  ) {
    return reply(
      `✅ How to Log a Dose:\n\n1. Go to your Dashboard or Reminders tab.\n2. Locate the medication card with the green "Take Dose" button.\n3. Click "Take Dose" — this immediately timestamps your intake, updates your daily adherence percentage, and sends a confirmation to your care log!`,
      ['When is my next dose?', 'Check my adherence', 'What medicines do I take?']
    );
  }

  // ── 9. CAREGIVER & CLINICAL CONTACT ──
  if (
    normalized.includes('caregiver') ||
    normalized.includes('doctor') ||
    normalized.includes('nurse') ||
    normalized.includes('contact') ||
    normalized.includes('phone') ||
    normalized.includes('call') ||
    normalized.includes('care team') ||
    normalized.includes('caretaker')
  ) {
    return reply(
      `👨‍⚕️ Clinical Care Team & Caregiver Oversight:\n\n• Caregiver Portal: Your assigned caregiver has real-time oversight of your dose logs, adherence trends, and critical missed dose alerts.\n• Direct Messages: You can send a direct note to your care team through the Care Messages section.\n• 24/7 Clinical Hotline: Call 1-800-PILLSYNC (toll-free) for non-emergency clinical scheduling questions.\n\n⚠️ For acute medical emergencies, call 911 immediately.`,
      ['What medicines do I take?', 'Check my adherence', 'What if I miss a dose?']
    );
  }

  // ── 10. ADD MEDICATION & OCR SCANNER ──
  if (
    normalized.includes('add medicine') ||
    normalized.includes('add medication') ||
    normalized.includes('new prescription') ||
    normalized.includes('how do i add') ||
    normalized.includes('scan') ||
    normalized.includes('ocr') ||
    normalized.includes('camera') ||
    normalized.includes('upload prescription')
  ) {
    return reply(
      `📷 Adding Prescriptions to PillSync:\n\n• Method 1 (OCR Prescription Scan): Navigate to the Prescription Scanner page and upload or take a clear picture of your Rx label. Our AI OCR will automatically extract the medication name, dosage, frequency, and instructions!\n• Method 2 (Manual Entry): Click "+ Add Medication" on your Dashboard or Prescriptions page and choose from our clinical preset library or enter custom times.`,
      ['What medicines do I take?', 'When is my next dose?', 'Check my adherence']
    );
  }

  // ── 11. SPECIFIC DRUG GUIDANCE ──
  if (normalized.includes('metformin')) {
    return reply(
      `💊 Metformin Information:\n• Purpose: Manages blood glucose levels in Type 2 Diabetes.\n• Administration: Take with or right after meals to minimize stomach upset.\n• Clinical Tip: Swallow whole with a full glass of water. Avoid excessive alcohol intake while taking Metformin.`,
      ['What medicines do I take?', 'When is my next dose?', 'Food & water advice']
    );
  }

  if (
    normalized.includes('lisinopril') ||
    normalized.includes('amlodipine') ||
    normalized.includes('losartan')
  ) {
    return reply(
      `💊 Blood Pressure Medication (ACE/ARB/CCB):\n• Purpose: Controls hypertension and protects heart/kidney function.\n• Clinical Tip: Take at the same time each day. Avoid sudden standing from a sitting or lying position to prevent dizziness. Stay well hydrated!`,
      ['What medicines do I take?', 'When is my next dose?', 'Side effects guidance']
    );
  }

  if (
    normalized.includes('atorvastatin') ||
    normalized.includes('rosuvastatin') ||
    normalized.includes('statin')
  ) {
    return reply(
      `💊 Statin (Cholesterol) Information:\n• Purpose: Lowers LDL cholesterol and protects cardiovascular health.\n• Administration: Best taken in the evening with or without food.\n• Caution: Avoid large amounts of grapefruit or grapefruit juice, which can increase medication concentration.`,
      ['What medicines do I take?', 'When is my next dose?', 'Food & water advice']
    );
  }

  if (normalized.includes('levothyroxine') || normalized.includes('synthroid')) {
    return reply(
      `💊 Levothyroxine (Thyroid Hormone):\n• Purpose: Restores optimal thyroid levels.\n• Administration: Take first thing in the morning on an empty stomach with a full glass of plain water, 30 to 60 minutes before breakfast or coffee for proper absorption.`,
      ['What medicines do I take?', 'When is my next dose?', 'Food & water advice']
    );
  }

  if (normalized.includes('amoxicillin') || normalized.includes('antibiotic')) {
    return reply(
      `💊 Antibiotic Therapy:\n• Clinical Rule: Finish the entire course of antibiotics as prescribed, even if symptoms improve early, to prevent bacterial resistance.\n• Tip: Taking with a light meal or yogurt can help protect gut flora.`,
      ['What medicines do I take?', 'When is my next dose?', 'What if I miss a dose?']
    );
  }

  if (normalized.includes('omeprazole') || normalized.includes('pantoprazole')) {
    return reply(
      `💊 Proton Pump Inhibitor (Acid Reflux/GERD):\n• Administration: Take 30 to 60 minutes before your first meal of the day.\n• Swallow whole; do not crush or chew.`,
      ['What medicines do I take?', 'When is my next dose?', 'Food & water advice']
    );
  }

  if (
    normalized.includes('aspirin') ||
    normalized.includes('ibuprofen') ||
    normalized.includes('advil')
  ) {
    return reply(
      `💊 NSAID / Pain Relief:\n• Purpose: Pain, inflammation, or cardiovascular prevention.\n• Caution: Always take with food or milk to prevent gastric irritation. Drink a full glass of water.`,
      ['What medicines do I take?', 'When is my next dose?', 'Side effects guidance']
    );
  }

  // ── 12. FOOD, WATER & INTERACTIONS ──
  if (
    normalized.includes('food') ||
    normalized.includes('water') ||
    normalized.includes('empty stomach') ||
    normalized.includes('alcohol') ||
    normalized.includes('grapefruit') ||
    normalized.includes('interaction')
  ) {
    return reply(
      `💧 Food, Water & Interaction Guidelines:\n\n• Water: Always take oral tablets with a full 8 oz glass of water to facilitate esophageal passage and stomach dissolution.\n• Food Requirements: Check individual prescription directions. Some meds (Metformin, NSAIDs) require meals to prevent nausea; others (Levothyroxine, PPIs) require an empty stomach.\n• Alcohol: Avoid alcohol with sedatives, painkillers, and certain antibiotics, as it significantly impairs metabolism and raises adverse risk.`,
      ['What medicines do I take?', 'When is my next dose?', 'What if I miss a dose?']
    );
  }

  // ── 13. SIDE EFFECTS ──
  if (
    normalized.includes('side effect') ||
    normalized.includes('nausea') ||
    normalized.includes('headache') ||
    normalized.includes('dizzy') ||
    normalized.includes('dizziness') ||
    normalized.includes('stomach') ||
    normalized.includes('feeling sick')
  ) {
    return reply(
      `🩺 Managing Medication Side Effects:\n\n• Mild nausea: Often alleviated by taking doses with a small meal or snack (unless empty stomach required).\n• Mild dizziness: Sit or lie down immediately; avoid operating vehicles until balance returns.\n• Continuous symptoms: If side effects persist for more than 48 hours, contact your physician or pharmacist to adjust the dosage.\n\n⚠️ If experiencing facial swelling, hives, or shortness of breath, call 911 immediately.`,
      ['Contact caregiver', 'What medicines do I take?', 'Emergency guidance']
    );
  }

  // ── 14. EMERGENCY / SEVERE ALERTS ──
  if (
    normalized.includes('emergency') ||
    normalized.includes('urgent') ||
    normalized.includes('chest pain') ||
    normalized.includes('allergic') ||
    normalized.includes('breath') ||
    normalized.includes('911') ||
    normalized.includes('severe')
  ) {
    return reply(
      `🚨 MEDICAL EMERGENCY ALERT:\n\nIf you or someone in your care is experiencing severe chest pain, shortness of breath, anaphylaxis, sudden confusion, or an acute reaction:\n\n👉 CALL 911 OR GO TO THE NEAREST EMERGENCY ROOM IMMEDIATELY.\n\nPillSync is a medication management tool and cannot replace emergency emergency medical services.`,
      ['Contact caregiver', 'What medicines do I take?']
    );
  }

  // ── 15. CHECK-IN / STREAK ──
  if (
    normalized.includes('checkin') ||
    normalized.includes('check-in') ||
    normalized.includes('check in') ||
    normalized.includes('streak')
  ) {
    return reply(
      `⭐ Daily Check-In:\n\nCompleting your daily check-in confirms to your caregiver that you have reviewed today's regimen, taken your morning vitals, and logged your doses. You can tap "Confirm Daily Check-in" at the top of your dashboard anytime!`,
      ['Check my adherence', 'What medicines do I take?', 'When is my next dose?']
    );
  }

  // ── 16. INTELLIGENT CLINICAL FALLBACK ──
  return reply(
    `Thank you for your question! As your PillSync Clinical Care AI, I can help you with anything regarding your medications, reminders, and health plan.\n\nHere are popular topics you can ask me:`,
    [
      'What medicines do I take?',
      'When is my next dose?',
      'Check my adherence',
      'What if I miss a dose?',
      'What happens when I snooze?',
      'Contact caregiver',
    ]
  );
}
