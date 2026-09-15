"""Parse Synthea CCDA XML patient files and extract patient and medication data.

This script reads all .xml files from the Synthea CCDA dataset directory,
parses each HL7 CCDA document safely, and outputs:
  - patients_raw.csv        : one row per patient with demographics
  - medication_counts.csv   : medication records with patient linkage

IMPORTANT: This script does NOT load any data into the PillSync application
database. The Synthea data is used only as a source for the ML training
pipeline.
"""

import argparse
import csv
import os
import sys
import traceback
import xml.etree.ElementTree as ET
from datetime import date, datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Default Synthea CCDA dataset directory
DEFAULT_SYNTHEA_DIR = Path(r'C:\Users\Venkateswararao\Downloads\synthea_sample_data_ccda_latest')

# Output directory (relative to this script's location)
OUTPUT_DIR = Path(__file__).resolve().parent / 'data' / 'synthea'

# HL7 CCDA namespace
HL7_NS = 'urn:hl7-org:v3'
NS = {'h': HL7_NS}

# LOINC code for medications section
MEDICATIONS_LOINC = '10160-0'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def tag(local_name: str) -> str:
    """Return Clark-notation tag for the HL7 v3 namespace."""
    return f'{{{HL7_NS}}}{local_name}'


def find_text(element, xpath_parts: list, ns=NS) -> str:
    """Safely traverse a chain of child tags and return text or empty string."""
    current = element
    for part in xpath_parts:
        if current is None:
            return ''
        current = current.find(f'h:{part}', ns)
    if current is None:
        return ''
    return (current.text or '').strip()


def get_attrib(element, xpath_parts: list, attrib: str, ns=NS) -> str:
    """Safely traverse to a child element and return the given attribute."""
    current = element
    for part in xpath_parts:
        if current is None:
            return ''
        current = current.find(f'h:{part}', ns)
    if current is None:
        return ''
    return current.get(attrib, '').strip()


def parse_birthdate(value: str) -> str:
    """Convert HL7 birthTime value (YYYYMMDD or YYYYMMDDHHMMSS) to ISO date."""
    if not value:
        return ''
    try:
        return datetime.strptime(value[:8], '%Y%m%d').date().isoformat()
    except ValueError:
        return ''


def calculate_age(birthdate_iso: str) -> int:
    """Return age in years from ISO date string, or -1 if unparseable."""
    if not birthdate_iso:
        return -1
    try:
        bd = date.fromisoformat(birthdate_iso)
        today = date.today()
        return today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
    except ValueError:
        return -1


def normalise_gender(code: str) -> str:
    """Map HL7 gender codes to normalised strings."""
    mapping = {'M': 'M', 'F': 'F', 'UN': 'U', 'UNK': 'U', '': 'U'}
    return mapping.get(code.upper(), 'U')


# ---------------------------------------------------------------------------
# Patient extraction
# ---------------------------------------------------------------------------

def extract_patient(root: ET.Element) -> dict:
    """Extract patient demographic information from a CCDA root element."""
    patient_role = root.find('.//h:recordTarget/h:patientRole', NS)
    if patient_role is None:
        return {}

    patient_node = patient_role.find('h:patient', NS)
    if patient_node is None:
        return {}

    # Patient ID: prefer the extension of the first id element
    id_elem = patient_role.find('h:id', NS)
    patient_id = ''
    if id_elem is not None:
        patient_id = id_elem.get('extension', '') or id_elem.get('root', '')

    # Demographics
    birthtime_elem = patient_node.find('h:birthTime', NS)
    birthtime_val = birthtime_elem.get('value', '') if birthtime_elem is not None else ''
    birthdate = parse_birthdate(birthtime_val)
    age = calculate_age(birthdate)

    gender_elem = patient_node.find('h:administrativeGenderCode', NS)
    gender_code = gender_elem.get('code', '') if gender_elem is not None else ''
    gender = normalise_gender(gender_code)

    # Name (optional â€” for linking, not for PillSync DB)
    given = find_text(patient_node, ['name', 'given'])
    family = find_text(patient_node, ['name', 'family'])

    return {
        'patient_id': patient_id,
        'birthdate': birthdate,
        'age': age,
        'gender': gender,
        'given_name': given,
        'family_name': family,
    }


# ---------------------------------------------------------------------------
# Medication extraction
# ---------------------------------------------------------------------------

def find_medications_section(root: ET.Element):
    """Return the medications section element, or None if not present."""
    for section in root.findall('.//h:section', NS):
        code_elem = section.find('h:code', NS)
        if code_elem is not None and code_elem.get('code') == MEDICATIONS_LOINC:
            return section
    return None


def extract_medications(root: ET.Element, patient_id: str) -> list:
    """Extract medication entries from a CCDA document.

    Returns a list of dicts with keys:
      patient_id, medication_name, start_date, end_date, status
    """
    meds_section = find_medications_section(root)
    if meds_section is None:
        return []

    medications = []
    for entry in meds_section.findall('.//h:substanceAdministration', NS):
        # Medication name â€” look in manufacturedMaterial/code
        name = ''
        code_elem = entry.find(
            './/h:consumable/h:manufacturedProduct/h:manufacturedMaterial/h:code', NS
        )
        if code_elem is not None:
            name = code_elem.get('displayName', '') or find_text(
                code_elem, ['originalText']
            )

        # Try translation element if displayName is empty
        if not name and code_elem is not None:
            trans = code_elem.find('h:translation', NS)
            if trans is not None:
                name = trans.get('displayName', '')

        if not name:
            # Try the reference text fallback
            ref = entry.find('.//h:reference', NS)
            if ref is not None:
                name = ref.get('value', '').lstrip('#')

        name = name.strip()
        if not name:
            continue

        # Effective time (start / end)
        start_date, end_date = '', ''
        for eff in entry.findall('h:effectiveTime', NS):
            low = eff.find('h:low', NS)
            high = eff.find('h:high', NS)
            if low is not None:
                start_date = parse_birthdate(low.get('value', ''))
            if high is not None:
                end_date = parse_birthdate(high.get('value', ''))
            # IVL_TS with a single value attribute
            if not start_date:
                val = eff.get('value', '')
                if val:
                    start_date = parse_birthdate(val)

        # Status code
        status_elem = entry.find('h:statusCode', NS)
        status = status_elem.get('code', '') if status_elem is not None else ''

        medications.append({
            'patient_id': patient_id,
            'medication_name': name,
            'start_date': start_date,
            'end_date': end_date,
            'status': status,
        })

    return medications


# ---------------------------------------------------------------------------
# File parsing
# ---------------------------------------------------------------------------

def parse_file(xml_path: Path) -> tuple:
    """Parse one CCDA XML file.

    Returns (patient_dict, [medication_dicts]) or raises on failure.
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()
    patient = extract_patient(root)
    if not patient:
        raise ValueError('No patient demographics found')
    if not patient.get('patient_id'):
        # Use filename stem as fallback ID
        patient['patient_id'] = xml_path.stem
    medications = extract_medications(root, patient['patient_id'])
    return patient, medications


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(synthea_dir: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    xml_files = sorted(synthea_dir.glob('*.xml'))
    print(f'Found {len(xml_files)} XML files in {synthea_dir}')

    patients = []
    all_medications = []
    failed = []

    for xml_path in xml_files:
        try:
            patient, meds = parse_file(xml_path)
            patients.append(patient)
            all_medications.extend(meds)
        except ET.ParseError as exc:
            failed.append((xml_path.name, f'XML parse error: {exc}'))
        except Exception as exc:
            failed.append((xml_path.name, str(exc)))

    # -----------------------------------------------------------------
    # Save patients_raw.csv
    # -----------------------------------------------------------------
    patients_path = output_dir / 'patients_raw.csv'
    patient_fields = ['patient_id', 'birthdate', 'age', 'gender', 'given_name', 'family_name']
    with patients_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=patient_fields)
        writer.writeheader()
        writer.writerows(patients)
    print(f'Saved {len(patients)} patients â†’ {patients_path}')

    # -----------------------------------------------------------------
    # Save medication_counts.csv
    # -----------------------------------------------------------------
    meds_path = output_dir / 'medication_counts.csv'
    med_fields = ['patient_id', 'medication_name', 'start_date', 'end_date', 'status']
    with meds_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=med_fields)
        writer.writeheader()
        writer.writerows(all_medications)
    print(f'Saved {len(all_medications)} medication records â†’ {meds_path}')

    # -----------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------
    patients_with_meds = len({m['patient_id'] for m in all_medications})
    unique_meds = len({m['medication_name'] for m in all_medications})

    print('\n' + '=' * 60)
    print('SYNTHEA CCDA PARSING SUMMARY')
    print('=' * 60)
    print(f'  XML files found          : {len(xml_files)}')
    print(f'  Successfully parsed      : {len(patients)}')
    print(f'  Failed / skipped         : {len(failed)}')
    print(f'  Patients with medications: {patients_with_meds}')
    print(f'  Total medication records : {len(all_medications)}')
    print(f'  Unique medication names  : {unique_meds}')
    if failed:
        print('\n  Failed files:')
        for name, reason in failed:
            print(f'    {name}: {reason}')
    print('=' * 60)

    return len(patients), len(all_medications)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--synthea-dir', type=Path, default=DEFAULT_SYNTHEA_DIR,
        help='Path to Synthea CCDA XML directory',
    )
    parser.add_argument(
        '--output-dir', type=Path, default=OUTPUT_DIR,
        help='Output directory for CSV files',
    )
    args = parser.parse_args()
    run(args.synthea_dir, args.output_dir)


if __name__ == '__main__':
    main()
