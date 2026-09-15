# Milestone 3 ML Data

Synthea archives are audited here as external synthetic data. They are not copied into the application SQLite database.

Run the audit from `backend`:

```powershell
python ml/audit_synthea.py "C:\Users\navya\Downloads\synthea_sample_data_csv_latest.zip" --output synthea-audit.json
```

The audit validates required files and columns, reports row counts and date coverage, and explicitly records whether the dataset contains usable supervised labels.
