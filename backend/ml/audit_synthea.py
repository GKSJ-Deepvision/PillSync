"""Audit a Synthea CSV ZIP without loading it into the application database."""

import argparse
import csv
import io
import json
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path

REQUIRED_FILES = {
    'patients.csv': {'Id', 'BIRTHDATE', 'GENDER'},
    'medications.csv': {'START', 'STOP', 'PATIENT', 'DESCRIPTION', 'DISPENSES'},
    'observations.csv': {'DATE', 'PATIENT', 'DESCRIPTION', 'VALUE', 'UNITS'},
    'encounters.csv': {'Id', 'START', 'STOP', 'PATIENT', 'ENCOUNTERCLASS'},
}


def read_rows(archive, filename):
    with archive.open(filename) as stream:
        text = io.TextIOWrapper(stream, encoding='utf-8-sig', newline='')
        yield from csv.DictReader(text)


def audit_dataset(dataset_path):
    with zipfile.ZipFile(dataset_path) as archive:
        available = set(archive.namelist())
        missing = sorted(set(REQUIRED_FILES) - available)
        if missing:
            raise ValueError(f'Missing required files: {", ".join(missing)}')

        headers = {}
        for filename, required_columns in REQUIRED_FILES.items():
            with archive.open(filename) as stream:
                header = next(csv.reader(io.TextIOWrapper(stream, encoding='utf-8-sig', newline='')))
            headers[filename] = {
                'columns': header,
                'missing_columns': sorted(required_columns - set(header)),
            }

        patients = list(read_rows(archive, 'patients.csv'))
        medications = list(read_rows(archive, 'medications.csv'))
        observations = list(read_rows(archive, 'observations.csv'))
        encounters = list(read_rows(archive, 'encounters.csv'))
        patient_ids = {row['Id'] for row in patients}
        medication_patient_ids = {row['PATIENT'] for row in medications}
        medication_descriptions = Counter(row['DESCRIPTION'] for row in medications)
        observation_dates = [datetime.fromisoformat(row['DATE'].replace('Z', '+00:00')) for row in observations if row.get('DATE')]

        return {
            'dataset': str(Path(dataset_path).resolve()),
            'files': sorted(available),
            'headers': headers,
            'counts': {
                'patients': len(patients),
                'medication_episodes': len(medications),
                'observations': len(observations),
                'encounters': len(encounters),
                'unique_medication_patients': len(medication_patient_ids),
                'medication_patient_id_overlap': len(patient_ids & medication_patient_ids),
                'active_medication_episodes': sum(not row.get('STOP') for row in medications),
            },
            'observation_date_range': {
                'start': min(observation_dates).date().isoformat() if observation_dates else None,
                'end': max(observation_dates).date().isoformat() if observation_dates else None,
            },
            'top_medications': medication_descriptions.most_common(20),
            'modeling_readiness': {
                'supports_medication_history': True,
                'supports_demographic_features': True,
                'supports_dose_level_taken_missed_labels': False,
                'supports_refill_event_labels': False,
                'supports_direct_adherence_labels': False,
                'recommended_use': 'feature enrichment and synthetic context, not supervised adherence training without generated labels',
            },
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    report = audit_dataset(args.dataset)
    payload = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(payload + '\n', encoding='utf-8')
    else:
        print(payload)


if __name__ == '__main__':
    main()
