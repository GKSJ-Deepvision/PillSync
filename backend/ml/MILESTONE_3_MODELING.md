# Milestone 3 Modeling

## Label Source

Training labels come only from PillSync `AdherenceRecord` events. Synthea is not treated as a taken/missed label source.

## Training Command

```powershell
cd backend
python ml/train_models.py
```

Prepare a de-identified Synthea feature table separately:

```powershell
python ml/prepare_synthea.py "C:\Users\navya\Downloads\synthea_sample_data_csv_latest.zip"
```

The prepared table contains only synthetic keys, age, gender, medication counts, condition counts, and observation counts. It excludes names, addresses, SSNs, passports, and source patient IDs.

Artifacts are written to `backend/ml/artifacts/` and are ignored by source control when generated locally.

The trainer refuses to claim a model is ready with fewer than 30 dose events or without both `Taken` and `Missed` classes. Until those conditions are met, the product uses the explainable rule-based baseline and reports that a trained model is unavailable.

## Features

- Scheduled hour and weekday
- Medication historical compliance
- Remaining medication ratio
- Patient missed-dose count before the event

Metrics written to `metrics.json`: accuracy, precision, recall, F1, and a classification report. These are training-set diagnostics only until a time-based holdout evaluation is added with sufficient history.
