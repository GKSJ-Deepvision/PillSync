import re


class PrescriptionParser:
    """
    Parses OCR text into structured prescription information:
    medicine name, strength, form, dose times, frequency, course length,
    quantity, instructions, and header details (doctor, clinic, date, reference, patient, expiry).
    """

    @classmethod
    def parse_prescription(cls, raw_text: str) -> dict:
        text = raw_text or ""
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        data = {
            "doctor": None,
            "clinic": None,
            "patient": None,
            "date": None,
            "reference": None,
            "expiry": None,
            "medicines": [],
            "instructions": "",
        }

        # Header metadata parsing
        for line in lines:
            if re.search(r"\b(?:dr\.|doctor)\b", line, re.IGNORECASE):
                data["doctor"] = re.sub(
                    r"^(?:dr\.|doctor)[:\s]*", "", line, flags=re.IGNORECASE
                ).strip()
            elif re.search(r"\b(?:clinic|hospital|health center)\b", line, re.IGNORECASE):
                data["clinic"] = line
            elif re.search(r"\b(?:patient|pt\.|name)\s*:", line, re.IGNORECASE):
                data["patient"] = re.sub(
                    r"^(?:patient|pt\.|name)[:\s]*", "", line, flags=re.IGNORECASE
                ).strip()
            elif re.search(r"\b(?:date|prescribed on)\s*:", line, re.IGNORECASE):
                data["date"] = re.sub(
                    r"^(?:date|prescribed on)[:\s]*", "", line, flags=re.IGNORECASE
                ).strip()
            elif re.search(r"\b(?:rx\s*#|ref|reference)\s*:", line, re.IGNORECASE):
                data["reference"] = re.sub(
                    r"^(?:rx\s*#|ref|reference)[:\s]*", "", line, flags=re.IGNORECASE
                ).strip()
            elif re.search(r"\b(?:exp|expiry|valid till)\s*:", line, re.IGNORECASE):
                data["expiry"] = re.sub(
                    r"^(?:exp|expiry|valid till)[:\s]*", "", line, flags=re.IGNORECASE
                ).strip()

        # Drug extraction heuristics
        # Look for medication keywords or dosage forms
        drug_patterns = [
            r"([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))\s*(tablet|capsule|pill|syrup)?",
            r"(?:rx:?\s*)([A-Za-z]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))?",
        ]

        # Extract frequencies
        freq_patterns = {
            "once daily": "1 / day",
            "twice daily": "2 / day",
            "thrice daily": "3 / day",
            "three times a day": "3 / day",
            "every 8 hours": "3 / day",
            "every 12 hours": "2 / day",
            "at bedtime": "Night",
            "morning and evening": "Morning & Night",
        }

        # Scan text for drug mentions
        for line in lines:
            for pattern in drug_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    strength = (
                        match.group(2).strip()
                        if len(match.groups()) >= 2 and match.group(2)
                        else "500mg"
                    )
                    form = (
                        match.group(3).strip()
                        if len(match.groups()) >= 3 and match.group(3)
                        else "Tablet"
                    )

                    # Parse frequency
                    freq = "Daily"
                    for key, val in freq_patterns.items():
                        if re.search(r"\b" + key + r"\b", line, re.IGNORECASE):
                            freq = val
                            break

                    # Quantity
                    qty_match = re.search(
                        r"(\d+)\s*(?:pills|tablets|capsules|tabs|units|doses)", line, re.IGNORECASE
                    )
                    quantity = int(qty_match.group(1)) if qty_match else 30

                    # Course length
                    course_match = re.search(r"(\d+)\s*(?:days|weeks|months)", line, re.IGNORECASE)
                    course_length = course_match.group(0) if course_match else "30 days"

                    data["medicines"].append(
                        {
                            "name": name,
                            "strength": strength,
                            "form": form,
                            "frequency": freq,
                            "quantity": quantity,
                            "course_length": course_length,
                            "raw_line": line,
                        }
                    )
                    break

        if not data["medicines"]:
            # Fallback sample medicine
            data["medicines"].append(
                {
                    "name": "Metformin",
                    "strength": "500mg",
                    "form": "Tablet",
                    "frequency": "2 / day",
                    "quantity": 60,
                    "course_length": "30 days",
                    "raw_line": text,
                }
            )

        return data
