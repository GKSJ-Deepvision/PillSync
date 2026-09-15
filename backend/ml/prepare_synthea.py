"""Create a de-identified Synthea feature table for Milestone 3 experiments."""

import argparse
import csv
import io
import zipfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path


def rows(archive, filename):
    with archive.open(filename) as stream:
        text = io.TextIOWrapper(stream, encoding='utf-8-sig', newline='')
        yield from csv.DictReader(text)


def prepare(dataset_path, output_path):
    with zipfile.ZipFile(dataset_path) as archive:
        patients = list(rows(archive, 'patients.csv'))
        medications = list(rows(archive, 'medications.csv'))
        conditions = list(rows(archive, 'conditions.csv'))
        observations = list(rows(archive, 'observations.csv'))

    medication_counts = Counter(row['PATIENT'] for row in medications)
    active_medication_counts = Counter(row['PATIENT'] for row in medications if not row.get('STOP'))
    condition_counts = Counter(row['PATIENT'] for row in conditions)
    observation_counts = Counter(row['PATIENT'] for row in observations)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        'synthea_patient_key', 'age_years', 'gender', 'medication_episode_count',
        'active_medication_count', 'condition_count', 'observation_count',
    ]
    with output_path.open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        today = date.today()
        for index, patient in enumerate(patients, start=1):
            birthdate = date.fromisoformat(patient['BIRTHDATE'])
            age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
            writer.writerow({
                'synthea_patient_key': f'synthea_{index:06d}',
                'age_years': age,
                'gender': patient.get('GENDER', ''),
                'medication_episode_count': medication_counts[patient['Id']],
                'active_medication_count': active_medication_counts[patient['Id']],
                'condition_count': condition_counts[patient['Id']],
                'observation_count': observation_counts[patient['Id']],
            })
    return len(patients)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('dataset', type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parent / 'data' / 'synthea_features.csv')
    args = parser.parse_args()
    print(f'created {prepare(args.dataset, args.output)} sanitized patient feature rows at {args.output}')


if __name__ == '__main__':
    main()
