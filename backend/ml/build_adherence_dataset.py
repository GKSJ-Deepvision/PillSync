"""Build a PillSync-specific synthetic medication adherence dataset from Synthea patient data.

Pipeline:
  1. Load patients_raw.csv and medication_counts.csv (output of parse_synthea_ccda.py)
  2. For each patient, generate 28 days of synthetic dose events:
       - Days 1-21  : historical period (features)
       - Days 22-28 : future period (target creation ONLY)
  3. Engineer historical adherence features from the 21-day window
  4. Create future_7day_risk target from the 7-day window
  5. Save pillsync_adherence_dataset.csv

TARGET LEAKAGE PREVENTION:
  Future period information (days 22-28) is used ONLY to create the target
  label and is NEVER included in the ML model input features.

ACADEMIC DISCLAIMER:
  This dataset uses synthetic patient data (Synthea) and synthetic adherence
  events. It is an academic ML prototype and not a clinical dataset.
"""

import argparse
import csv
import random
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / 'data' / 'synthea'
PATIENTS_CSV = DATA_DIR / 'patients_raw.csv'
MEDS_CSV = DATA_DIR / 'medication_counts.csv'
OUTPUT_CSV = DATA_DIR / 'pillsync_adherence_dataset.csv'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
HISTORICAL_DAYS = 21   # days used for feature engineering
FUTURE_DAYS = 7        # days used for target creation only
TOTAL_DAYS = HISTORICAL_DAYS + FUTURE_DAYS  # 28

# Risk label thresholds (heuristic thresholds for this academic prototype only)
# These are NOT universal clinical standards.
HIGH_THRESHOLD = 50.0    # adherence < 50% → HIGH risk
MEDIUM_THRESHOLD = 80.0  # adherence < 80% → MEDIUM risk (else LOW)


# ---------------------------------------------------------------------------
# Synthetic adherence event generator
# ---------------------------------------------------------------------------

def assign_patient_tendency(patient_idx: int, age: int, num_meds: int, rng: random.Random) -> dict:
    """Assign a base medication adherence profile to a patient.

    The profile is seeded from the patient index so it is reproducible.
    Age and medication burden influence the adherence tendency.

    Returns dict with:
      base_take_prob   : probability of taking a dose on a given day
      base_snooze_prob : probability of snoozing (vs. outright missing)
      streak_penalty   : additional miss probability per consecutive miss day
    """
    # Older patients and those on many medications tend to have lower adherence
    # in this synthetic model (a simplification for prototype purposes)
    age_factor = max(0.0, min(1.0, (age - 18) / 70.0)) if age >= 18 else 0.5
    med_burden_factor = max(0.0, min(1.0, (num_meds - 1) / 9.0))

    # Base take probability drawn from a Beta distribution for realistic variation
    # We bias the distribution toward reasonable adherence (alpha > beta)
    alpha = rng.uniform(3.0, 8.0)   # shape parameters
    beta_param = rng.uniform(1.0, 4.0)

    # numpy rng for Beta; use patient_idx as seed offset
    np_rng = np.random.default_rng(RANDOM_SEED + hash(patient_idx) % 100_000)
    base_take = float(np_rng.beta(alpha, beta_param))

    # Adjust for age and medication burden (both reduce adherence slightly)
    penalty = 0.08 * age_factor + 0.06 * med_burden_factor
    base_take = max(0.25, min(0.97, base_take - penalty))

    # Patients with lower take probability snooze more (partial non-compliance)
    base_snooze = rng.uniform(0.05, 0.25) * (1.0 - base_take)

    # Streak penalty: each consecutive missed dose increases future miss probability
    streak_penalty = rng.uniform(0.03, 0.12)

    return {
        'base_take_prob': base_take,
        'base_snooze_prob': base_snooze,
        'streak_penalty': streak_penalty,
    }


def generate_dose_events(tendency: dict, total_days: int, doses_per_day: int, rng: random.Random) -> list:
    """Generate a sequence of dose events with temporal consistency.

    Each event is one of: 'Taken', 'Missed', 'Snoozed'.

    Temporal consistency is achieved by tracking consecutive missed doses and
    applying a streak penalty to future take probability — patients who have
    been non-compliant recently are somewhat more likely to continue missing
    doses (and vice versa).

    Returns a flat list of event strings, length = total_days * doses_per_day.
    """
    events = []
    consecutive_missed = 0

    for _day in range(total_days):
        for _dose in range(doses_per_day):
            # Streak-adjusted take probability
            take_prob = max(
                0.10,
                tendency['base_take_prob'] - consecutive_missed * tendency['streak_penalty']
            )
            # Small recovery factor: very long streaks sometimes broken
            if consecutive_missed >= 4:
                take_prob = max(take_prob, 0.20)

            r = rng.random()
            if r < take_prob:
                events.append('Taken')
                consecutive_missed = 0
            elif r < take_prob + tendency['base_snooze_prob']:
                events.append('Snoozed')
                # Snoozed counts as a mild miss for streak purposes
                consecutive_missed = max(0, consecutive_missed - 1)
            else:
                events.append('Missed')
                consecutive_missed += 1

    return events


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def compute_adherence_pct(taken: int, total: int) -> float:
    """Adherence % = taken / total * 100, or 0 if total == 0."""
    return round(taken / total * 100, 2) if total > 0 else 0.0


def compute_consecutive_missed(events: list) -> int:
    """Return the length of the current trailing run of Missed events."""
    count = 0
    for event in reversed(events):
        if event == 'Missed':
            count += 1
        else:
            break
    return count


def engineer_features(events: list, historical_days: int, doses_per_day: int) -> dict:
    """Compute historical adherence features from event list.

    IMPORTANT: Only uses the first historical_days * doses_per_day events.
    Future events (beyond this window) are never accessed here.
    """
    total_hist = historical_days * doses_per_day
    hist_events = events[:total_hist]

    taken_21 = hist_events.count('Taken')
    missed_21 = hist_events.count('Missed')
    snoozed_21 = hist_events.count('Snoozed')

    adh_21 = compute_adherence_pct(taken_21, total_hist)
    miss_rate = compute_adherence_pct(missed_21, total_hist)
    snooze_rate = compute_adherence_pct(snoozed_21, total_hist)

    # 7-day and 14-day sub-windows (most recent days within historical period)
    doses_7 = 7 * doses_per_day
    doses_14 = 14 * doses_per_day
    hist_7 = hist_events[-doses_7:] if len(hist_events) >= doses_7 else hist_events
    hist_14 = hist_events[-doses_14:] if len(hist_events) >= doses_14 else hist_events

    adh_7 = compute_adherence_pct(hist_7.count('Taken'), len(hist_7))
    adh_14 = compute_adherence_pct(hist_14.count('Taken'), len(hist_14))

    consec_missed = compute_consecutive_missed(hist_events)

    return {
        'previous_21day_taken': taken_21,
        'previous_21day_missed': missed_21,
        'previous_21day_snoozed': snoozed_21,
        'previous_7day_adherence': adh_7,
        'previous_14day_adherence': adh_14,
        'previous_21day_adherence': adh_21,
        'miss_rate': miss_rate,
        'snooze_rate': snooze_rate,
        'consecutive_missed': consec_missed,
    }


def compute_future_target(events: list, historical_days: int, future_days: int, doses_per_day: int) -> dict:
    """Compute future 7-day adherence and risk label.

    ONLY accesses future events (beyond the historical window).
    Returns future stats and the risk label used as the ML target.
    """
    hist_total = historical_days * doses_per_day
    future_events = events[hist_total:]

    future_taken = future_events.count('Taken')
    future_missed = future_events.count('Missed')
    future_snoozed = future_events.count('Snoozed')
    future_total = future_days * doses_per_day

    future_adh = compute_adherence_pct(future_taken, future_total)

    # Risk label assignment — heuristic thresholds for this academic prototype
    # Future 7-Day Adherence >= 80% → LOW
    # Future 7-Day Adherence >= 50% → MEDIUM
    # Future 7-Day Adherence <  50% → HIGH
    if future_adh >= MEDIUM_THRESHOLD:
        risk = 'LOW'
    elif future_adh >= HIGH_THRESHOLD:
        risk = 'MEDIUM'
    else:
        risk = 'HIGH'

    return {
        'future_7day_taken': future_taken,
        'future_7day_missed': future_missed,
        'future_7day_snoozed': future_snoozed,
        'future_7day_adherence': future_adh,
        'future_7day_risk': risk,
    }


# ---------------------------------------------------------------------------
# Dataset builder
# ---------------------------------------------------------------------------

def build_dataset(patients_df: pd.DataFrame, meds_df: pd.DataFrame) -> pd.DataFrame:
    """Build the full adherence dataset (one row per patient).

    Each patient is assigned a single adherence profile that drives both
    historical and future events, ensuring temporal consistency without
    direct label leakage.
    """
    # Count medications per patient (active + historical)
    med_counts = meds_df.groupby('patient_id')['medication_name'].count().reset_index()
    med_counts.columns = ['patient_id', 'num_medications']

    # Merge counts onto patients
    df = patients_df.merge(med_counts, on='patient_id', how='left')
    df['num_medications'] = df['num_medications'].fillna(1).astype(int).clip(lower=1)

    # Gender encoding: M=0, F=1, U=2
    gender_map = {'M': 0, 'F': 1, 'U': 2}
    df['gender_encoded'] = df['gender'].map(gender_map).fillna(2).astype(int)

    # Age: replace invalid ages with median
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    median_age = df.loc[df['age'] >= 0, 'age'].median()
    df['age'] = df['age'].where(df['age'] >= 0, median_age).fillna(30).astype(int)

    # Doses per day: 1 or 2 per medication (seeded per patient)
    records = []
    master_rng = random.Random(RANDOM_SEED)

    for idx, row in df.reset_index(drop=True).iterrows():
        patient_rng = random.Random(RANDOM_SEED + idx)
        num_meds = int(row['num_medications'])
        age = int(row['age'])

        # Assign doses per day (1 or 2 for each medication, sum capped at 4)
        doses_list = [patient_rng.choice([1, 2]) for _ in range(num_meds)]
        doses_per_day = min(sum(doses_list), 4)

        # Assign patient tendency profile
        tendency = assign_patient_tendency(idx, age, num_meds, patient_rng)

        # Generate all 28 days of events
        events = generate_dose_events(tendency, TOTAL_DAYS, doses_per_day, patient_rng)

        # Engineer historical features (days 1-21 only)
        hist_features = engineer_features(events, HISTORICAL_DAYS, doses_per_day)

        # Compute future target (days 22-28 only — NOT used as model input)
        future_target = compute_future_target(events, HISTORICAL_DAYS, FUTURE_DAYS, doses_per_day)

        record = {
            # Patient identifiers & demographics
            'patient_id': row['patient_id'],
            'age': age,
            'gender': row['gender'],
            'gender_encoded': int(row['gender_encoded']),
            'num_medications': num_meds,
            'doses_per_day': doses_per_day,
            # Historical features (model inputs)
            **hist_features,
            # Future target (NOT model inputs — used only for label creation)
            **future_target,
        }
        records.append(record)

    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_dataset(df: pd.DataFrame) -> None:
    """Print dataset validation summary and flag data quality issues."""
    print('\n' + '=' * 60)
    print('DATASET VALIDATION SUMMARY')
    print('=' * 60)
    print(f'  Rows                    : {len(df)}')
    print(f'  Columns                 : {len(df.columns)}')
    print(f'  Patients represented    : {df["patient_id"].nunique()}')
    print(f'  Duplicate rows          : {df.duplicated().sum()}')

    print('\n  Missing values per column:')
    missing = df.isnull().sum()
    for col, count in missing.items():
        if count > 0:
            print(f'    {col}: {count}')
    if missing.sum() == 0:
        print('    None')

    print('\n  Class distribution (future_7day_risk):')
    dist = df['future_7day_risk'].value_counts()
    for label, count in dist.items():
        pct = count / len(df) * 100
        print(f'    {label}: {count} ({pct:.1f}%)')

    # Sanity checks
    issues = []
    pct_cols = [
        'previous_7day_adherence', 'previous_14day_adherence',
        'previous_21day_adherence', 'miss_rate', 'snooze_rate',
        'future_7day_adherence',
    ]
    for col in pct_cols:
        if col in df.columns:
            bad = df[(df[col] < 0) | (df[col] > 100)]
            if len(bad) > 0:
                issues.append(f'  {col}: {len(bad)} values outside [0, 100]')

    count_cols = [
        'previous_21day_taken', 'previous_21day_missed', 'previous_21day_snoozed',
        'future_7day_taken', 'future_7day_missed', 'future_7day_snoozed',
    ]
    for col in count_cols:
        if col in df.columns:
            bad = df[df[col] < 0]
            if len(bad) > 0:
                issues.append(f'  {col}: {len(bad)} negative values')

    if df['patient_id'].isnull().any():
        issues.append('  patient_id: contains null values')

    valid_risks = {'LOW', 'MEDIUM', 'HIGH'}
    invalid_risk = ~df['future_7day_risk'].isin(valid_risks)
    if invalid_risk.any():
        issues.append(f'  future_7day_risk: {invalid_risk.sum()} invalid values')

    if issues:
        print('\n  DATA QUALITY ISSUES:')
        for issue in issues:
            print(f'   ⚠  {issue}')
    else:
        print('\n  All data quality checks passed.')

    print('\n  Data types:')
    for col, dtype in df.dtypes.items():
        print(f'    {col}: {dtype}')
    print('=' * 60)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--patients-csv', type=Path, default=PATIENTS_CSV)
    parser.add_argument('--meds-csv', type=Path, default=MEDS_CSV)
    parser.add_argument('--output-csv', type=Path, default=OUTPUT_CSV)
    args = parser.parse_args()

    print('Loading Synthea parsed data...')
    if not args.patients_csv.exists():
        print(f'ERROR: patients CSV not found: {args.patients_csv}')
        print('Run parse_synthea_ccda.py first.')
        return
    if not args.meds_csv.exists():
        print(f'ERROR: medication counts CSV not found: {args.meds_csv}')
        print('Run parse_synthea_ccda.py first.')
        return

    patients_df = pd.read_csv(args.patients_csv)
    meds_df = pd.read_csv(args.meds_csv)

    print(f'Loaded {len(patients_df)} patients, {len(meds_df)} medication records')
    print('Generating synthetic adherence events and engineering features...')

    dataset = build_dataset(patients_df, meds_df)

    # Validate
    validate_dataset(dataset)

    # Save
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(args.output_csv, index=False)
    print(f'\nSaved adherence dataset → {args.output_csv}')
    print(f'Total rows: {len(dataset)}')


if __name__ == '__main__':
    main()
