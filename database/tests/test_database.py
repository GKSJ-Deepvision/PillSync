from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]

def test_csv_has_718_records():
    import csv
    with open(ROOT/'data'/'medicines.csv', encoding='utf-8') as f:
        assert sum(1 for _ in csv.DictReader(f)) == 718

def test_schema_contains_core_tables():
    # lightweight structural test against source SQL
    text=(ROOT/'sql'/'schema_postgresql.sql').read_text()
    for table in ['patients','medicines','prescriptions','prescription_medicines','dosage_schedules','medication_history']:
        assert f'CREATE TABLE {table}' in text
