"""Import the supplied 718-row CSV into the local SQLite database."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import init_db, seed_medicines, medicine_count
init_db(); seed_medicines(); print(f'Imported {medicine_count()} medicines.')
