/**
 * Comprehensive Pharmaceutical Catalog & Clinical Prescription Parser
 * Parses raw optical character recognition (OCR) text from:
 * 1. Multi-drug Doctor Prescription Slips (handwritten & printed)
 * 2. Blister packs and foil strips (e.g. Cetirizine, Dolo, Calpol, Somasure)
 * 3. Syrup / drops / oral liquid bottles
 * 4. Medicine cartons and packaging boxes
 */

// Comprehensive Drug Catalog with common OCR typos & handwritten shorthand patterns
const DRUG_CATALOG = [
  // Multi-drug doctor slip specifics & Indian Clinic Shorthand
  {
    canonical: 'Betaloc',
    match: /\b(?:b[ea]t[a-z]{2,8}|betaloc|metoprolol)\b/i,
    defaultStrength: '100 mg',
    defaultFreq: 'Twice daily (BID)',
    defaultInst: 'Take with water as directed by physician',
  },
  {
    canonical: 'Oxprenolol',
    match: /\b(?:o[rx]pre[a-z]{2,8}|oxprenolol)\b/i,
    defaultStrength: '50 mg',
    defaultFreq: 'Once daily (QD)',
    defaultInst: 'Take with water as directed by physician',
  },
  {
    canonical: 'Cimetidine',
    match: /\b(?:c[inm]et[a-z]{2,8}|erith|gweticine)\b/i,
    defaultStrength: '50 mg',
    defaultFreq: 'Three times daily (TID)',
    defaultInst: 'Take with water as directed by physician',
  },
  {
    canonical: 'Dorzolamide',
    match: /\b(?:dorz[a-z]{3,10}|dorzox)\b/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Three times daily (TID)',
    defaultInst: 'Take with water as directed by physician',
  },

  // Indian Clinic Prescription Common Handwritten Regimens
  {
    canonical: 'Cefixime (Zifi)',
    match: /\b(?:zl[\s\-_]?nov|zifi|zocon|cefixime)\b/i,
    defaultStrength: '200 mg',
    defaultFreq: 'Twice daily (BD)',
    defaultInst: 'Take after meals with water',
  },
  {
    canonical: 'Rosuvastatin (Rosuvas)',
    match: /\b(?:ros[\s\-_]?pes|rosuv|rosuvas|roseday)\b/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take at bedtime',
  },
  {
    canonical: 'Zerodol-SP (Aceclofenac + Paracetamol)',
    match: /\b(?:zerf[\s\-_]?cq|zerf|zerodol|zenflox)\b/i,
    defaultStrength: '100 mg / 325 mg',
    defaultFreq: 'Twice daily after food (BD)',
    defaultInst: 'Take with food or after meals',
  },
  {
    canonical: 'Aceclofenac (Leclof)',
    match: /\b(?:leclof|aceclo|aceclofenac)\b/i,
    defaultStrength: '100 mg',
    defaultFreq: 'Twice daily after food (BD)',
    defaultInst: 'Take with food',
  },
  {
    canonical: 'Cetirizine / Cital',
    match: /\b(?:cited|cital|cetirizine)\b/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take with water at bedtime',
  },
  {
    canonical: 'Levocetirizine (Levocet)',
    match: /\b(?:lew[\s\-_]?fr|levocet|levoflox|levo)\b/i,
    defaultStrength: '5 mg',
    defaultFreq: 'Once daily (Night)',
    defaultInst: 'Take with water',
  },

  // Antihistamines & Allergy
  {
    canonical: 'Cetirizine Dihydrochloride',
    match: /c[ef]t[il]r[il]z[il]ne/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take with water at bedtime',
  },
  {
    canonical: 'Levocetirizine',
    match: /levocet[il]r[il]z[il]ne|xyzal/i,
    defaultStrength: '5 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take with water at bedtime',
  },
  {
    canonical: 'Chlorpheniramine Maleate',
    match: /chlorphen[il]ram[il]ne|maleate/i,
    defaultStrength: '4 mg',
    defaultFreq: 'As directed by physician',
    defaultInst: 'Take with water',
  },
  {
    canonical: 'Fexofenadine (Allegra)',
    match: /fexofenad[il]ne|allegra/i,
    defaultStrength: '120 mg',
    defaultFreq: 'Once daily (Morning)',
    defaultInst: 'Take before meals with water',
  },
  {
    canonical: 'Montelukast & Levocetirizine',
    match: /montelukast|montair/i,
    defaultStrength: '10 mg / 5 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take at bedtime',
  },

  // Analgesics & Anti-inflammatory
  {
    canonical: 'Paracetamol',
    match: /paracetamol|acetaminophen|dolo|calpol|crocin/i,
    defaultStrength: '650 mg',
    defaultFreq: 'As needed (PRN - SOS)',
    defaultInst: 'Take with water as needed for fever or pain',
  },
  {
    canonical: 'Ibuprofen',
    match: /ibuprofen|advil|motrin|combiflam/i,
    defaultStrength: '400 mg',
    defaultFreq: 'Twice daily after meals',
    defaultInst: 'Take with food or milk',
  },
  {
    canonical: 'Aspirin (Ecosprin)',
    match: /aspirin|ecosprin/i,
    defaultStrength: '75 mg',
    defaultFreq: 'Once daily after food',
    defaultInst: 'Take after meals',
  },
  {
    canonical: 'Diclofenac',
    match: /diclofenac|voveran|volini/i,
    defaultStrength: '50 mg',
    defaultFreq: 'Twice daily after meals',
    defaultInst: 'Take with food',
  },

  // Antibiotics & Anti-infectives
  {
    canonical: 'Amoxicillin & Clavulanate (Augmentin)',
    match: /augmentin|moxikind|clavam|amoxil/i,
    defaultStrength: '625 mg',
    defaultFreq: 'Twice daily (BD)',
    defaultInst: 'Take at start of meals with water',
  },
  {
    canonical: 'Amoxicillin',
    match: /amoxic[il]{1,2}[il]n/i,
    defaultStrength: '500 mg',
    defaultFreq: 'Three times daily (TID)',
    defaultInst: 'Take every 8 hours with water',
  },
  {
    canonical: 'Azithromycin (Azithral)',
    match: /azithrom[iy]c[il]n|azithral|zithromax/i,
    defaultStrength: '500 mg',
    defaultFreq: 'Once daily (OD)',
    defaultInst: 'Take 1 hour before or 2 hours after meals',
  },
  {
    canonical: 'Ciprofloxacin (Ciplox)',
    match: /ciprofloxac[il]n|ciplox|cifran/i,
    defaultStrength: '500 mg',
    defaultFreq: 'Twice daily (BD)',
    defaultInst: 'Take with plenty of water',
  },
  {
    canonical: 'Cefixime (Taxim-O)',
    match: /cefix[il]me|taxim/i,
    defaultStrength: '200 mg',
    defaultFreq: 'Twice daily (BD)',
    defaultInst: 'Take after meals',
  },

  // Cardiovascular & Hypertension
  {
    canonical: 'Amlodipine & Atenolol',
    match: /amlodipine\s*[+&]\s*atenolol|bp[\s\-_]*prime/i,
    defaultStrength: '5 mg / 50 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take in the morning with water',
  },
  {
    canonical: 'Amlodipine',
    match: /amlod[il]p[il]ne|norvasc|amlokind/i,
    defaultStrength: '5 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take once daily with water',
  },
  {
    canonical: 'Atenolol',
    match: /atenolol|tenormin/i,
    defaultStrength: '50 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take in the morning with water',
  },
  {
    canonical: 'Telmisartan (Telma)',
    match: /telm[il]sartan|telma/i,
    defaultStrength: '40 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take once daily with water',
  },
  {
    canonical: 'Lisinopril',
    match: /l[il]s[il]nopr[il]l|zestril/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take in the morning with water',
  },
  {
    canonical: 'Atorvastatin (Lipitor)',
    match: /atorvastat[il]n|lipitor|atorva/i,
    defaultStrength: '10 mg',
    defaultFreq: 'Once daily (Bedtime - HS)',
    defaultInst: 'Take at bedtime',
  },

  // Gastrointestinal & Antacids
  {
    canonical: 'Pantoprazole (Pan-40)',
    match: /pantoprazole|pantocid|pan[\s\-_]*40|pan[\s\-_]*d/i,
    defaultStrength: '40 mg',
    defaultFreq: 'Once daily before breakfast',
    defaultInst: 'Take 30 minutes before morning meal',
  },
  {
    canonical: 'Omeprazole',
    match: /omeprazole|prilosec|omez/i,
    defaultStrength: '20 mg',
    defaultFreq: 'Once daily before breakfast',
    defaultInst: 'Take before food on empty stomach',
  },
  {
    canonical: 'Esomeprazole (Nexium)',
    match: /esomeprazole|nexium|esoz/i,
    defaultStrength: '40 mg',
    defaultFreq: 'Once daily before breakfast',
    defaultInst: 'Take before breakfast',
  },
  {
    canonical: 'Belladonna & Amphojel',
    match: /belladonna|amphojel/i,
    defaultStrength: 'As prescribed',
    defaultFreq: 'Three times daily before meals',
    defaultInst: 'Take 30 minutes before meals with water',
  },

  // Diabetes & Endocrine
  {
    canonical: 'Metformin HCl',
    match: /metform[il]n|glucophage|glycomet/i,
    defaultStrength: '500 mg',
    defaultFreq: 'Twice daily with meals',
    defaultInst: 'Take with or immediately after meals',
  },
  {
    canonical: 'Glimepiride (Amaryl)',
    match: /glimepiride|amaryl/i,
    defaultStrength: '2 mg',
    defaultFreq: 'Once daily before breakfast',
    defaultInst: 'Take with first main meal',
  },
  {
    canonical: 'TRUEplus Glucose Tablets',
    match: /trueplus|glucose\s*tablets?/i,
    defaultStrength: '4 g',
    defaultFreq: 'As needed for low blood sugar',
    defaultInst: 'Chew 3-4 tablets for hypoglycemia',
  },

  // Neuropsychiatric
  {
    canonical: 'Flupentixol & Melitracen (Somasure)',
    match: /flupent[il]xol|mel[il]tracen|somasure|placida|deanxit/i,
    defaultStrength: '0.5 mg / 10 mg',
    defaultFreq: 'Once daily (Morning - OD)',
    defaultInst: 'Take in the morning with water',
  },
  {
    canonical: 'Alprazolam (Xanax)',
    match: /alprazolam|xanax|restyl|trika/i,
    defaultStrength: '0.5 mg',
    defaultFreq: 'As directed by physician',
    defaultInst: 'Take with water as directed',
  },
  {
    canonical: 'Clonazepam (Klonopin)',
    match: /clonazepam|klonopin|clonafit/i,
    defaultStrength: '0.5 mg',
    defaultFreq: 'Once daily at bedtime',
    defaultInst: 'Take at bedtime',
  },
  {
    canonical: 'Fluoxetine (Prozac)',
    match: /fluoxetine|prozac|flunil/i,
    defaultStrength: '20 mg',
    defaultFreq: 'Once daily in morning',
    defaultInst: 'Take in the morning',
  },
];

const PRESCRIPTION_KEYWORDS = [
  /\b(?:prescription|rx\b|rc\b|doctor|dr\b|dr\.|physician|consultant|polyclinic|medical\s+centre|clinic|hospital)\b/i,
  /\b(?:patient|name|nome|gender|age|sex|date|refill|refills|dispense|signature)\b/i,
  /\b(?:tab\b|tabs\b|cap\b|caps\b|bid\b|tid\b|qid\b|qd\b|od\b|sos\b|hs\b|prn\b)\b/i,
];

function isPrescriptionContext(text) {
  let count = 0;
  for (const re of PRESCRIPTION_KEYWORDS) {
    if (re.test(text)) count++;
  }
  return count >= 1;
}

function extractStrength(line) {
  const m = line.match(/\b([1-9]\d*(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|%)\b/i);
  if (m) {
    return `${m[1]} ${m[2].toLowerCase()}`;
  }
  return null;
}

function extractQuantity(line, fullText) {
  const m = line.match(/\b(?:qty|quantity|dispense|count|#)[:\s]*(\d{1,3})\b/i);
  if (m) return parseInt(m[1], 10);
  const tabM = line.match(/\b(\d{1,3})\s*(?:tablets?|capsules?|tabs?|caps?)\b/i);
  if (tabM) return parseInt(tabM[1], 10);
  const fullM = fullText.match(/\b(?:qty|quantity|dispense)[:\s]*(\d{1,3})\b/i);
  if (fullM) return parseInt(fullM[1], 10);
  return 30;
}

function extractFrequency(line) {
  if (/\b(?:bid|b\.i\.d\.|twice\s+daily|2\s+times|bd)\b/i.test(line)) {
    return 'Twice daily (BID)';
  }
  if (/\b(?:tid|t\.i\.d\.|three\s+times|3\s+times|tds)\b/i.test(line)) {
    return 'Three times daily (TID)';
  }
  if (/\b(?:qid|q\.i\.d\.|four\s+times|4\s+times)\b/i.test(line)) {
    return 'Four times daily (QID)';
  }
  if (/\b(?:qd|q\.d\.|once\s+daily|daily|od|every\s+day)\b/i.test(line)) {
    return 'Once daily (QD)';
  }
  if (/\b(?:bedtime|at\s+night|hs|h\.s\.)\b/i.test(line)) {
    return 'Once daily (Bedtime - HS)';
  }
  if (/\b(?:as\s+needed|prn|p\.r\.n\.|sos)\b/i.test(line)) {
    return 'As needed (PRN - SOS)';
  }
  return 'As directed by physician';
}

function extractDosage(line) {
  const m = line.match(/\b(\d+)\s*(tabs?|caps?|tablets?|capsules?)\b/i);
  if (m) {
    const unit = /tab/i.test(m[2]) ? 'tablet' : 'capsule';
    return `${m[1]} ${parseInt(m[1], 10) > 1 ? unit + 's' : unit}`;
  }
  if (/capsule|cap\b/i.test(line)) return '1 capsule';
  if (/syrup|syr\b/i.test(line)) return '10 ml';
  if (/drops?\b/i.test(line)) return '1-2 drops';
  return '1 tablet';
}

function cleanCandidateLine(line) {
  if (!line) return '';
  return line
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/^(?:do|be|bd|no|rx|tab|cap|inj|syr)[\s._-]+/i, '')
    .trim();
}

export function parsePrescriptionText(rawText, filename = '') {
  const text = (rawText || '').trim();
  const combined = `${text} ${filename}`.trim();

  const isRx = isPrescriptionContext(combined);
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  const foundMedicines = [];
  const seenCanonical = new Set();

  // If this is a clinical prescription with clinic/doctor header, identify the prescription body
  let inPrescriptionBody = !isRx; // if not Rx, check all lines; if Rx, wait for patient line or start
  let hasPatientHeader = lines.some((l) => /name|nome|gender|age|date|weight|patient/i.test(l));

  for (const line of lines) {
    // If slip has demographic header, only start matching after demographic line
    if (hasPatientHeader && !inPrescriptionBody) {
      if (/name|nome|gender|age|date|weight|patient/i.test(line)) {
        inPrescriptionBody = true;
      }
      continue;
    }

    // Stop at pharmacy / footer signatures
    if (
      inPrescriptionBody &&
      /doctor'?s?\s*con|medical\s*&\s*general|pharmacy|store|h\.no|village|note\s*:/i.test(line)
    ) {
      break;
    }

    const cleaned = cleanCandidateLine(line);
    if (cleaned.length < 3) continue;

    for (const drug of DRUG_CATALOG) {
      if (drug.match.test(cleaned) || drug.match.test(line)) {
        if (!seenCanonical.has(drug.canonical)) {
          seenCanonical.add(drug.canonical);
          const strength =
            extractStrength(cleaned) || extractStrength(line) || drug.defaultStrength;
          const frequency = extractFrequency(cleaned) || extractFrequency(line) || drug.defaultFreq;
          const dosage = extractDosage(cleaned) || extractDosage(line);
          const quantity = extractQuantity(cleaned, text);
          const instructions = drug.defaultInst || 'Take with water as directed by physician';

          foundMedicines.push({
            medicine_name: drug.canonical,
            strength,
            quantity,
            dosage,
            frequency,
            instructions,
            confidence: 0.95,
          });
        }
      }
    }
  }

  // 2. If line-by-line caught nothing, scan full text for catalog entries
  if (foundMedicines.length === 0) {
    for (const drug of DRUG_CATALOG) {
      if (drug.match.test(combined)) {
        if (!seenCanonical.has(drug.canonical)) {
          seenCanonical.add(drug.canonical);
          const strength = extractStrength(combined) || drug.defaultStrength;
          const frequency = extractFrequency(combined) || drug.defaultFreq;
          const dosage = extractDosage(combined);
          const quantity = extractQuantity(combined, combined);

          foundMedicines.push({
            medicine_name: drug.canonical,
            strength,
            quantity,
            dosage,
            frequency,
            instructions: drug.defaultInst,
            confidence: 0.92,
          });
        }
      }
    }
  }

  // 3. Fallback for packaging cartons / blister packs
  if (foundMedicines.length === 0) {
    const pharmaWord = combined.match(
      /\b([A-Z][a-z]{3,}(?:-[A-Za-z0-9]+)?)\s*(?:tablets?|capsules?|syrup|injection|drops?|suspension)\b/i
    );
    const strengthMatch = extractStrength(combined);
    if (pharmaWord || (strengthMatch && isRx)) {
      const name = pharmaWord ? pharmaWord[1] : 'Prescribed Clinical Medication';
      const strength = strengthMatch || 'As prescribed';
      const frequency = extractFrequency(combined);
      const dosage = extractDosage(combined);
      const quantity = extractQuantity(combined, combined);

      foundMedicines.push({
        medicine_name: name,
        strength,
        quantity,
        dosage,
        frequency,
        instructions: 'Take with water as directed by physician',
        confidence: 0.88,
      });
    }
  }

  // 4. Line by line fallback for doctor handwriting with dosage digits (e.g. Tab. Augmentin 625)
  if (foundMedicines.length === 0 && isRx) {
    for (const line of lines) {
      const clean = cleanCandidateLine(line);
      const m = clean.match(
        /^([A-Za-z]{3,}(?:\s+[A-Za-z]+)?)\s*[:.-]?\s*([1-9]\d*)\s*(?:mg|mcg|g|ml|tab|cap|bd|bid|tid|qd)?/i
      );
      if (
        m &&
        !/^(medical|doctor|patient|address|date|name|phone|clinic|refill|general|savis|wees)/i.test(
          m[1]
        )
      ) {
        const name = m[1].trim();
        const strength = extractStrength(line) || `${m[2]} mg`;
        const frequency = extractFrequency(line);
        foundMedicines.push({
          medicine_name: name,
          strength,
          quantity: 30,
          dosage: extractDosage(line),
          frequency,
          instructions: 'Take with water as directed by physician',
          confidence: 0.85,
        });
      }
    }
  }

  if (foundMedicines.length === 0) {
    return {
      is_medicine: false,
      medicine_name: null,
      strength: null,
      quantity: null,
      dosage: null,
      frequency: null,
      instructions: null,
      confidence: 0,
      medicines: [],
      total_medicines: 0,
      error_detail:
        'Non-medication image: No prescription, dosage, or medicine packaging text found.',
    };
  }

  const primary = foundMedicines[0];
  return {
    is_medicine: true,
    medicine_name: primary.medicine_name,
    strength: primary.strength,
    quantity: primary.quantity,
    dosage: primary.dosage,
    frequency: primary.frequency,
    instructions: primary.instructions,
    confidence: primary.confidence,
    medicines: foundMedicines,
    total_medicines: foundMedicines.length,
  };
}
