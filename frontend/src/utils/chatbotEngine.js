/**
 * PillSync Knowledge Base Chatbot Engine
 * Grounded directly in pillsync_knowledge_base.txt
 */

export const PILLSYNC_DISCLAIMER =
  'PillSync is an intelligent reminder and medication tracking platform and does not replace professional medical advice. For emergencies, please call 911 or your local emergency services immediately.';

const KNOWLEDGE_RESPONSES = [
  {
    keywords: ['hello', 'hi', 'hey', 'start', 'help', 'who are you', 'what can you do'],
    response:
      'Hello! I am your PillSync AI Care Assistant. I can help you with medication schedules, smart reminders, adherence tracking, marking doses as taken/missed/snoozed, caregiver coordination, and platform features. How can I assist you today?',
  },
  {
    keywords: ['medicines today', 'what medicines', 'take today', 'today schedule', 'my medicines'],
    response:
      'According to your care plan, your scheduled medicines for today include:\n• 08:00 AM: Metformin 500mg (1 tablet after breakfast)\n• 08:00 AM: Lisinopril 10mg (1 tablet with water)\n• 01:00 PM: Vitamin D3 2000 IU (1 softgel with lunch)\n• 08:30 PM: Atorvastatin 20mg (1 tablet before bedtime).\n\nYou can view and log them on your Dashboard or Reminders page!',
  },
  {
    keywords: ['adherence', 'my adherence', 'percentage', 'score', 'compliance', 'rate'],
    response:
      'Your overall medication adherence is currently at 94%, meeting your clinical target of >90%! Adherence is calculated by comparing completed on-time doses against scheduled doses. High adherence directly stabilizes your health metrics like blood pressure and blood sugar.',
  },
  {
    keywords: ['miss', 'missed dose', 'missed medication', 'did i miss', 'forget', 'forgot'],
    response:
      'If you missed a dose:\n1. Check the Reminders or Dashboard page to see which dose was missed.\n2. Do NOT double your dose unless explicitly instructed by your physician.\n3. Take it as soon as you remember, unless it is close to your next scheduled time.\n4. You can log it as "Missed" in PillSync so your caregiver is aware and can assist you.',
  },
  {
    keywords: ['mark as taken', 'how to mark', 'mark taken', 'take medicine', 'took dose'],
    response:
      'To mark a medicine as taken, go to your Dashboard or Reminders page and click the green "Take Dose" button next to the medication. This immediately records the intake timestamp and updates your adherence score.',
  },
  {
    keywords: ['snooze', 'snoozed', 'delay reminder', 'what happens snooze'],
    response:
      'When you click "Snooze" on a dose reminder, PillSync will temporarily dismiss the alert and send you a follow-up reminder after 30 minutes, ensuring you don\'t forget to take your medication.',
  },
  {
    keywords: ['caregiver', 'who is my caregiver', 'doctor', 'caretaker', 'contact caregiver'],
    response:
      'Your assigned lead caregiver is Dr. Oliver Mitchell (Internal Medicine & Chronic Disease Care). Caregivers can monitor your adherence progress, review missed dose alerts, and message you directly through the Care Messages feature.',
  },
  {
    keywords: ['how can my caregiver monitor', 'caregiver monitor', 'oversight', 'cohort'],
    response:
      'Caregivers use the PillSync Caregiver Portal to monitor assigned patient cohorts, view real-time dose logs, track biometric correlations, and receive automatic SMS/Push escalation alerts if a critical dose is delayed by over 45 minutes.',
  },
  {
    keywords: ['add medicine', 'add medication', 'new prescription', 'how do i add'],
    response:
      'To add a new medication, click the "+ Add Medication" button in the Dashboard or visit Prescriptions (/medications/new). Enter the medicine name, dosage, frequency, start/end dates, instructions, and disease category.',
  },
  {
    keywords: ['roles', 'role', 'admin', 'patient', 'user roles', 'access'],
    response:
      'PillSync supports 3 distinct roles:\n• Patient: Manage personal prescriptions, dose reminders, log taken/missed/snoozed doses, and track adherence.\n• Caregiver: Monitor assigned patients, inspect adherence trends, and coordinate care.\n• Admin: Platform oversight, manage user access, review compliance audit logs, and configure platform settings.',
  },
  {
    keywords: ['jwt', 'security', 'hipaa', 'auth', 'password', 'token', 'login'],
    response:
      'PillSync uses secure 256-bit JWT authentication and HIPAA-ready encryption. User sessions are verified with 24-hour access tokens and 7-day refresh tokens stored securely.',
  },
  {
    keywords: ['emergency', 'urgent', 'pain', 'severe', 'hospital', 'side effect', 'allergic'],
    response:
      '⚠️ If you are experiencing severe symptoms, an allergic reaction, or a medical emergency, please call 911 or go to the nearest emergency room immediately. PillSync does not provide emergency diagnostic services.',
  },
];

export function getChatbotResponse(userQuery) {
  if (!userQuery || typeof userQuery !== 'string') {
    return 'Please ask a question about your medications, reminders, or adherence.';
  }

  const normalized = userQuery.toLowerCase().trim();

  // Search knowledge base
  for (const item of KNOWLEDGE_RESPONSES) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return item.response;
    }
  }

  // Fallback response with helpful guide
  return 'Thank you for your question. Based on the PillSync Clinical Knowledge Base, PillSync helps you manage medications, track daily reminders, log taken/snoozed doses, and monitor adherence with your caregiver.\n\nYou can ask me:\n• "What medicines do I need to take today?"\n• "What is my adherence percentage?"\n• "What happens when I snooze a reminder?"\n• "How do I contact my caregiver?"';
}
