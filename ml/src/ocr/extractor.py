"""
Clinical Medicine Information Extraction Engine for PillSync.
Extracts structured medication records (Medicine Name, Dosage, Quantity, Frequency,
Duration, and Prescription Details) from raw OCR text. Supports multi-medicine
prescriptions, fuzzy typo tolerance, normalization, and confidence estimation.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

# Comprehensive clinical dictionary of common medications (generics & common brands)
# Categorized for broad coverage: Analgesics, Antibiotics, Antihistamines,
# Antihypertensives, Antidiabetics, Gastrointestinal, Respiratory, Vitamins, etc.
DRUG_LEXICON = [
    # Analgesics & Antipyretics
    "Paracetamol", "Acetaminophen", "Ibuprofen", "Aspirin", "Diclofenac", "Naproxen",
    "Tramadol", "Celecoxib", "Aceclofenac", "Ketorolac", "Mefenamic Acid",
    "Dolo", "Crocin", "Calpol", "Combiflam", "Panadol",

    # Antibiotics & Antimicrobials
    "Amoxicillin", "Azithromycin", "Ciprofloxacin", "Levofloxacin", "Doxycycline",
    "Cephalexin", "Cefixime", "Clavulanate", "Augmentin", "Metronidazole",
    "Erythromycin", "Clarithromycin", "Sulfamethoxazole", "Ampicillin", "Nitrofurantoin",
    "Ofloxacin", "Cefuroxime", "Cefpodoxime", "Norfloxacin",

    # Antihistamines & Allergy
    "Cetirizine", "Levocetirizine", "Loratadine", "Desloratadine", "Fexofenadine",
    "Diphenhydramine", "Chlorpheniramine", "Montelukast", "Hydroxyzine", "Allegra",
    "Zyrtec", "Claritin", "Avil",

    # Antihypertensives & Cardiovascular
    "Amlodipine", "Telmisartan", "Losartan", "Valsartan", "Olmesartan", "Atenolol",
    "Metoprolol", "Propranolol", "Bisoprolol", "Carvedilol", "Enalapril", "Lisinopril",
    "Ramipril", "Hydrochlorothiazide", "Furosemide", "Spironolactone", "Atorvastatin",
    "Rosuvastatin", "Simvastatin", "Clopidogrel", "Digoxin", "Diltiazem",

    # Antidiabetic Agents
    "Metformin", "Glimepiride", "Gliclazide", "Glibenclamide", "Sitagliptin",
    "Vildagliptin", "Linagliptin", "Dapagliflozin", "Empagliflozin", "Pioglitazone",
    "Insulin", "Glipizide", "Januvia", "Glycomet",

    # Gastrointestinal & Antacids
    "Pantoprazole", "Omeprazole", "Rabeprazole", "Esomeprazole", "Lansoprazole",
    "Ranitidine", "Famotidine", "Domperidone", "Ondansetron", "Sucralfate",
    "Pan-D", "Omez", "Rantac", "Pantocid",

    # Respiratory & Cough
    "Salbutamol", "Albuterol", "Budecort", "Budesonide", "Formoterol", "Ipratropium",
    "Theophylline", "Ambroxol", "Guaifenesin", "Dextromethorphan", "Asthalin",
    "Levosalbutamol", "Deriphyllin",

    # Vitamins, Minerals & Supplements
    "Vitamin C", "Vitamin D3", "Vitamin B12", "Calcium", "Zinc", "Folic Acid",
    "Multivitamin", "Becosules", "Shelcal", "Neurobion", "Ferrous Sulfate",
    "B-Complex", "Iron", "Ascorbic Acid", "Cholecalciferol",

    # Steroids & Anti-inflammatory
    "Prednisolone", "Methylprednisolone", "Dexamethasone", "Betamethasone", "Deflazacort",

    # Central Nervous System & Psychiatric
    "Alprazolam", "Clonazepam", "Diazepam", "Lorazepam", "Escitalopram", "Sertraline",
    "Fluoxetine", "Amitriptyline", "Gabapentin", "Pregabalin", "Duloxetine",
]

# Patterns for clinical frequencies and their canonical normalized descriptions
FREQUENCY_MAP = [
    (r"\b(once\s+(a\s+)?daily|1\s+time\s+(a\s+)?(day|daily)|o\.?d\.?|q\.?d\.?)\b", "Once daily"),
    (r"\b(twice\s+(a\s+)?daily|2\s+times?\s+(a\s+)?(day|daily)|b\.?i\.?d\.?|b\.?d\.?)\b", "Twice daily"),
    (r"\b(thrice\s+(a\s+)?daily|three\s+times\s+(a\s+)?(day|daily)|3\s+times?\s+(a\s+)?(day|daily)|t\.?i\.?d\.?|t\.?d\.?s\.?)\b", "Three times daily"),
    (r"\b(four\s+times\s+(a\s+)?(day|daily)|4\s+times?\s+(a\s+)?(day|daily)|q\.?i\.?d\.?)\b", "Four times daily"),
    (r"\b(every\s+8\s+hours?|q8h)\b", "Every 8 hours"),
    (r"\b(every\s+12\s+hours?|q12h)\b", "Every 12 hours"),
    (r"\b(every\s+6\s+hours?|q6h)\b", "Every 6 hours"),
    (r"\b(every\s+4\s+hours?|q4h)\b", "Every 4 hours"),
    (r"\b(morning\s+and\s+night|morning\s+&\s+night|morn\s+&\s+night)\b", "Morning and night"),
    (r"\b(in\s+the\s+morning|morning\s+only|at\s+morning)\b", "Morning"),
    (r"\b(at\s+night|at\s+bedtime|night\s+only|bedtime|h\.?s\.?)\b", "Night"),
    (r"\b(after\s+breakfast)\b", "After breakfast"),
    (r"\b(before\s+breakfast)\b", "Before breakfast"),
    (r"\b(as\s+needed|p\.?r\.?n\.?|when\s+required)\b", "As needed"),
]

# Patterns for dosage strengths (metric/clinical units)
DOSAGE_PATTERN = re.compile(
    r"\b(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|puff|drops?)\b",
    re.IGNORECASE
)

# Patterns for dispense / total quantity
QUANTITY_PATTERN = re.compile(
    r"\b(?:qty|quantity|dispense|take|total|strip\s+of)?\s*:?\s*(\d+)\s*(tablets?|capsules?|pills?|bottles?|strips?|vials?|ampoules?|ml)\b",
    re.IGNORECASE
)

# Patterns for duration
DURATION_PATTERN = re.compile(
    r"\b(?:for\s+)?(\d+\s*(?:to\s*\d+\s*)?(?:days?|weeks?|months?))\b",
    re.IGNORECASE
)

# Patterns for administration timing / details
DETAILS_PATTERNS = [
    (r"\b(after\s+(?:food|meals?|eating|breakfast|dinner|lunch))\b", "After food"),
    (r"\b(before\s+(?:food|meals?|eating|breakfast|dinner|lunch))\b", "Before food"),
    (r"\b(with\s+(?:food|meals?|water|milk))\b", "With food/water"),
    (r"\b(empty\s+stomach)\b", "On an empty stomach"),
    (r"\b(at\s+night|at\s+bedtime)\b", "At night / bedtime"),
    (r"\b(oral|sublingual|topical|inhalation|intravenous|im)\b", "Route: Oral"),
    (r"\b(do\s+not\s+crush|chew\s+well|shake\s+well)\b", "Special instruction"),
]

# Doctor / Header / Clinic filter words to avoid misidentifying doctor names as medicines
HEADER_PREFIXES = [
    "dr.", "dr ", "doctor", "hospital", "clinic", "pharmacy", "prescription",
    "patient", "age", "gender", "date", "reg", "phone", "address", "rx",
    "signature", "license", "qualification", "mbbs", "md", "consultant"
]


def _levenshtein_distance(s1: str, s2: str) -> int:
    """Computes Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


class MedicineExtractor:
    """
    Extracts structured multi-medicine records from OCR raw text.
    """

    def __init__(self, drug_lexicon: Optional[List[str]] = None):
        self.lexicon = drug_lexicon if drug_lexicon is not None else DRUG_LEXICON

    def extract(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parses raw text and extracts structured medicine items.
        
        Args:
            raw_text: Raw string output from OCR.
            
        Returns:
            List of structured medicine dictionaries.
        """
        if not raw_text or not raw_text.strip():
            return []

        # Step 0: Normalize OCR artifacts (merged tokens, missing spaces around units and timings)
        cleaned_text = self._clean_ocr_artifacts(raw_text)

        # Step 1: Pre-clean and split into line blocks
        lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]

        # Step 2: Segment prescription into medication line blocks
        medicine_blocks = self._segment_into_medicine_blocks(lines)

        # Step 3: Extract structured fields from each block
        structured_records = []
        for block in medicine_blocks:
            record = self._parse_block(block)
            if record and record.get("medicine_name"):
                structured_records.append(record)

        # Fallback: If block segmentation found no named drugs, try whole-text scan
        if not structured_records:
            fallback_record = self._parse_fallback(cleaned_text)
            if fallback_record:
                structured_records.append(fallback_record)

        return structured_records

    def _clean_ocr_artifacts(self, text: str) -> str:
        """
        Cleans common OCR merging errors (e.g. '5daysafter' -> '5 days after',
        '500mg' -> '500 mg', 'dailyfor' -> 'daily for').
        """
        t = text
        # Insert space between numbers and units: e.g. 500mg -> 500 mg, 5days -> 5 days
        t = re.sub(r"(\d+)(mg|mcg|ml|g|iu|tablets?|capsules?|days?|weeks?|months?)", r"\1 \2", t, flags=re.IGNORECASE)
        # Insert space between time units and prepositions: e.g. daysafter -> days after
        t = re.sub(r"(days?|weeks?|months?)(after|before|with|for)", r"\1 \2", t, flags=re.IGNORECASE)
        # Insert space between frequency and prepositions: e.g. dailyfor -> daily for
        t = re.sub(r"(daily|night|morning)(for|after|before)", r"\1 \2", t, flags=re.IGNORECASE)
        # Clean hyphenation around numbers: e.g. -1 tablet -> - 1 tablet
        t = re.sub(r"-\s*(\d+)", r"- \1", t)
        return t

    def _segment_into_medicine_blocks(self, lines: List[str]) -> List[str]:
        """
        Splits prescription text into individual medication blocks using
        numbering (1., 2.), bullets, or drug name occurrences.
        """
        blocks = []
        current_block = []

        for line in lines:
            lower_line = line.lower()

            # Ignore header lines (clinic, doctor name, patient demographic info)
            if self._is_header_line(lower_line):
                continue

            # Check if this line starts a new medication entry
            # E.g. "1. Paracetamol 500mg" or "- Cetirizine" or "Tab. Amoxicillin"
            is_new_entry = (
                re.match(r"^(?:\d+[\.\)\-:]|\*|-|•|tab(?:let)?\.?|cap(?:sule)?\.?|syr(?:up)?\.?)\s+", lower_line) or
                self._line_contains_known_drug(lower_line)
            )

            if is_new_entry and current_block:
                blocks.append(" ".join(current_block))
                current_block = [line]
            else:
                current_block.append(line)

        if current_block:
            blocks.append(" ".join(current_block))

        return blocks

    def _is_header_line(self, lower_line: str) -> bool:
        """Determines if a line is a clinic/doctor header rather than a medicine order."""
        for prefix in HEADER_PREFIXES:
            if lower_line.startswith(prefix) or f" {prefix}" in lower_line:
                # If line also contains a strong dosage like '500mg', it might be a valid order
                if not DOSAGE_PATTERN.search(lower_line):
                    return True
        return False

    def _line_contains_known_drug(self, lower_line: str) -> bool:
        """Checks if a line contains any known drug from the lexicon."""
        words = re.findall(r"[a-zA-Z]+", lower_line)
        for w in words:
            if len(w) >= 4:
                match, dist = self._find_best_drug_match(w)
                if match and dist <= 1:
                    return True
        return False

    def _parse_block(self, block_text: str) -> Optional[Dict[str, Any]]:
        """Parses a single medication text block into structured fields."""
        # 1. Extract Medicine Name
        med_name, name_conf = self._extract_medicine_name(block_text)
        if not med_name:
            return None

        # 2. Extract Dosage
        dosage, dosage_conf = self._extract_dosage(block_text)

        # 3. Extract Duration (extract before frequency so duration isn't conflated)
        duration = self._extract_duration(block_text)

        # 4. Extract Frequency
        frequency, freq_conf = self._extract_frequency(block_text)

        # 5. Extract Quantity (separated from dosage)
        quantity = self._extract_quantity(block_text, dosage)

        # 6. Extract Prescription Details (food instructions, warnings)
        details = self._extract_details(block_text)

        # 7. Aggregate Confidence rating
        overall_confidence = self._compute_confidence(name_conf, dosage_conf, freq_conf)

        return {
            "medicine_name": med_name,
            "dosage": dosage if dosage else None,
            "quantity": quantity if quantity else None,
            "frequency": frequency if frequency else None,
            "duration": duration if duration else None,
            "prescription_details": details if details else None,
            "confidence": overall_confidence,
        }

    def _extract_medicine_name(self, text: str) -> Tuple[Optional[str], str]:
        """
        Finds the most probable medicine name in text using dictionary + fuzzy distance.
        """
        words = re.findall(r"[a-zA-Z]{4,}", text)
        best_match = None
        best_dist = 999
        matched_token = ""

        for token in words:
            lower_token = token.lower()
            # Skip common non-drug clinical words
            if lower_token in ("tablet", "tablets", "capsule", "capsules", "syrup",
                               "daily", "twice", "times", "water", "after", "before",
                               "food", "morning", "night", "every", "hours", "days"):
                continue

            match, dist = self._find_best_drug_match(token)
            if match and dist < best_dist and dist <= 2:
                best_match = match
                best_dist = dist
                matched_token = token

        if best_match:
            confidence = "High" if best_dist == 0 else "Medium"
            return best_match, confidence

        # If no lexicon match, check if first non-prefix capitalized word looks like a drug
        for token in words:
            lower_token = token.lower()
            if not any(lower_token.startswith(p) for p in HEADER_PREFIXES):
                if len(token) >= 5 and token[0].isupper():
                    return token.capitalize(), "Low"

        return None, "Low"

    def _find_best_drug_match(self, candidate: str) -> Tuple[Optional[str], int]:
        """Finds closest matching drug in lexicon using edit distance."""
        cand_lower = candidate.lower()
        cand_len = len(cand_lower)
        best_drug = None
        min_dist = 999

        for drug in self.lexicon:
            drug_lower = drug.lower()
            # Fast filter: skip if length difference > 2
            if abs(len(drug_lower) - cand_len) > 2:
                continue

            # Exact prefix match
            if drug_lower == cand_lower:
                return drug, 0

            dist = _levenshtein_distance(cand_lower, drug_lower)
            if dist < min_dist:
                min_dist = dist
                best_drug = drug

        return best_drug, min_dist

    def _extract_dosage(self, text: str) -> Tuple[Optional[str], str]:
        """Extracts strength dosage (e.g. 500 mg, 10 mg, 5 ml)."""
        match = DOSAGE_PATTERN.search(text)
        if match:
            value = match.group(1)
            unit = match.group(2).lower()
            # Normalize unit display
            if unit in ('mg', 'mcg', 'g', 'ml', 'iu'):
                return f"{value} {unit}", "High"
            elif unit.startswith('drop'):
                return f"{value} drops", "High"
            elif unit.startswith('puff'):
                return f"{value} puff", "High"
            return f"{value} {unit}", "Medium"
        return None, "Low"

    def _extract_quantity(self, text: str, dosage: Optional[str] = None) -> Optional[str]:
        """Extracts total dispense quantity, carefully avoiding the dosage strength."""
        matches = QUANTITY_PATTERN.finditer(text)
        for match in matches:
            qty_str = f"{match.group(1)} {match.group(2).lower()}"
            # Ensure quantity isn't identical to the dosage
            if dosage and qty_str.lower() in dosage.lower():
                continue
            return qty_str

        # Pattern for "Qty: 10" or "Strip of 10"
        qty_num = re.search(r"\b(?:qty|quantity|strip\s+of|total)\s*:?\s*(\d+)\b", text, re.IGNORECASE)
        if qty_num:
            return f"{qty_num.group(1)} units"

        return None

    def _extract_frequency(self, text: str) -> Tuple[Optional[str], str]:
        """Extracts and normalizes clinical frequency."""
        for pattern, normalized in FREQUENCY_MAP:
            if re.search(pattern, text, re.IGNORECASE):
                return normalized, "High"

        # Check for Latin shorthand: 1-0-1 or 1-0-0 or 1-1-1
        pattern_numeric = re.search(r"\b([01])-([01])-([01])(?:-([01]))?\b", text)
        if pattern_numeric:
            m, a, n = pattern_numeric.group(1), pattern_numeric.group(2), pattern_numeric.group(3)
            active_doses = sum([int(m), int(a), int(n)])
            if active_doses == 1:
                return "Once daily", "Medium"
            elif active_doses == 2:
                return "Twice daily", "Medium"
            elif active_doses == 3:
                return "Three times daily", "Medium"

        return None, "Low"

    def _extract_duration(self, text: str) -> Optional[str]:
        """Extracts duration of treatment (e.g. 5 days, 2 weeks)."""
        match = DURATION_PATTERN.search(text)
        if match:
            dur = match.group(1).strip()
            # Clean leading 'for ' if captured
            dur = re.sub(r"^for\s+", "", dur, flags=re.IGNORECASE)
            return dur
        return None

    def _extract_details(self, text: str) -> Optional[str]:
        """Extracts prescription instructions (food timing, special notes)."""
        detected_details = []
        for pattern, label in DETAILS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                if label not in detected_details:
                    detected_details.append(label)

        if detected_details:
            return ", ".join(detected_details)
        return None

    def _compute_confidence(self, name_conf: str, dosage_conf: str, freq_conf: str) -> str:
        """Determines the aggregate extraction confidence level."""
        high_count = sum(1 for c in (name_conf, dosage_conf, freq_conf) if c == "High")
        if high_count >= 2:
            return "High"
        elif name_conf == "High" or (dosage_conf == "High" and freq_conf == "High"):
            return "Medium"
        return "Low"

    def _parse_fallback(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """Scans the entire raw text if block segmentation failed to yield items."""
        return self._parse_block(raw_text)
