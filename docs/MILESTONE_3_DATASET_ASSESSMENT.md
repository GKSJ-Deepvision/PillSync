# Milestone 3 Dataset Assessment

## Dataset Reviewed

`synthea_sample_data_csv_latest.zip`

Audit results for the supplied sample:

- 108 synthetic patients
- 3,850 medication episodes
- 105 unique patients with medication records, all linked to the patient table
- 68,648 observations
- 5,571 encounters
- 268 medication episodes without a stop date
- Observation dates spanning 1960-03-25 through 2026-08-17

## What It Supports

Synthea can provide synthetic context and feature enrichment for:

- Patient demographics
- Diagnoses and conditions
- Medication history and active medication episodes
- Encounter history
- Laboratory and observation features
- Allergy context

## What It Does Not Provide

The supplied files do not contain product-level labels for:

- Individual dose taken, missed, or snoozed events
- Reminder delivery or response
- Actual refill events
- Patient adherence percentages
- Caregiver alert outcomes

Therefore, Synthea should not be used directly as a supervised training set for missed-dose or adherence prediction. The application database's `Schedule` and `AdherenceRecord` data should become the primary labeled source after enough usage history is collected.

## Recommended Milestone 3 Plan

1. Keep Synthea in a separate ML-data area; do not import it into the live user database.
2. Run `backend/ml/audit_synthea.py` against the ZIP before every modeling experiment.
3. Normalize medication episodes, observations, conditions, and allergies into feature tables.
4. Define labels from PillSync events, such as missed dose within 24 hours or refill needed within 7 days.
5. Use Synthea only for synthetic context and development experiments until product labels are available.
6. Compare every model with the existing rule-based baseline.
7. Report precision, recall, calibration, and data limitations; do not present outputs as medical diagnosis.

## Audit Command

```powershell
cd backend
python ml/audit_synthea.py "C:\Users\navya\Downloads\synthea_sample_data_csv_latest.zip" --output synthea-audit.json
```
