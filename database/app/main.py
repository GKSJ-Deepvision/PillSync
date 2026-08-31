from datetime import date, datetime, time
from pathlib import Path
import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent.parent
DB = BASE / 'pillsync.db'
CSV = BASE / 'data' / 'medicines.csv'

app = FastAPI(title='PillSync - Medication Management API', version='1.0.0')


def get_conn():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def init_db():
    conn = get_conn()
    conn.executescript('''
    CREATE TABLE IF NOT EXISTS patients (
        patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        phone TEXT,
        email TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicines (
        medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        generic_name TEXT NOT NULL UNIQUE,
        drug_class TEXT,
        indications TEXT,
        dosage_form TEXT,
        strength TEXT,
        route_of_administration TEXT,
        side_effects TEXT,
        contraindications TEXT,
        interaction_warnings_precautions TEXT,
        storage_conditions TEXT,
        pregnancy_category TEXT,
        reference TEXT,
        availability TEXT
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
        prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        prescription_date TEXT NOT NULL,
        expiry_date TEXT,
        doctor_name TEXT,
        notes TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescription_medicines (
        prescription_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        prescribed_quantity INTEGER,
        instructions TEXT,
        PRIMARY KEY (prescription_id, medicine_id),
        FOREIGN KEY(prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
        FOREIGN KEY(medicine_id) REFERENCES medicines(medicine_id)
    );

    CREATE TABLE IF NOT EXISTS dosage_schedules (
        schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        dosage_per_intake REAL NOT NULL,
        frequency TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
        FOREIGN KEY(medicine_id) REFERENCES medicines(medicine_id)
    );

    CREATE TABLE IF NOT EXISTS medication_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        schedule_id INTEGER,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Taken','Missed','Snoozed')),
        taken_at TEXT,
        notes TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
        FOREIGN KEY(medicine_id) REFERENCES medicines(medicine_id),
        FOREIGN KEY(schedule_id) REFERENCES dosage_schedules(schedule_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(generic_name);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_patient ON dosage_schedules(patient_id);
    CREATE INDEX IF NOT EXISTS idx_history_patient ON medication_history(patient_id);
    ''')
    conn.commit()
    conn.close()


def seed_medicines():
    import csv
    conn = get_conn()
    count = conn.execute('SELECT COUNT(*) FROM medicines').fetchone()[0]
    if count == 0:
        with open(CSV, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = []
            for r in reader:
                rows.append((r['Generic Name'], r['Drug Class'], r['Indications'], r['Dosage Form'],
                    r['Strength'], r['Route of Administration'], r['Side Effects'], r['Contraindications'],
                    r['Interaction warnings & Precautions'], r['Storage Conditions'], r['Pregnancy Category'],
                    r['Reference'], r['Availability']))
            conn.executemany('''INSERT INTO medicines
                (generic_name, drug_class, indications, dosage_form, strength, route_of_administration,
                 side_effects, contraindications, interaction_warnings_precautions, storage_conditions,
                 pregnancy_category, reference, availability)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''', rows)
        conn.commit()
    conn.close()


init_db()
seed_medicines()


class PatientIn(BaseModel):
    name: str = Field(min_length=1)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class PrescriptionIn(BaseModel):
    patient_id: int
    prescription_date: date
    expiry_date: Optional[date] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionMedicineIn(BaseModel):
    prescription_id: int
    medicine_id: int
    prescribed_quantity: Optional[int] = Field(default=None, ge=0)
    instructions: Optional[str] = None


class ScheduleIn(BaseModel):
    patient_id: int
    medicine_id: int
    dosage_per_intake: float = Field(gt=0)
    frequency: str
    scheduled_time: time
    start_date: date
    end_date: Optional[date] = None


class HistoryIn(BaseModel):
    patient_id: int
    medicine_id: int
    schedule_id: Optional[int] = None
    scheduled_time: datetime
    status: str
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None


@app.get('/')
def root():
    return {'project': 'PillSync', 'module': 'Medication Management', 'medicine_count': medicine_count()}


def medicine_count():
    conn = get_conn(); n = conn.execute('SELECT COUNT(*) FROM medicines').fetchone()[0]; conn.close(); return n


@app.get('/medicines')
def list_medicines(search: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    conn = get_conn()
    if search:
        rows = conn.execute('''SELECT * FROM medicines WHERE generic_name LIKE ? OR drug_class LIKE ?
                              ORDER BY generic_name LIMIT ? OFFSET ?''', (f'%{search}%', f'%{search}%', limit, offset)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM medicines ORDER BY generic_name LIMIT ? OFFSET ?', (limit, offset)).fetchall()
    conn.close(); return [dict(r) for r in rows]


@app.get('/medicines/{medicine_id}')
def get_medicine(medicine_id: int):
    conn = get_conn(); r = conn.execute('SELECT * FROM medicines WHERE medicine_id=?', (medicine_id,)).fetchone(); conn.close()
    if not r: raise HTTPException(404, 'Medicine not found')
    return dict(r)


@app.post('/patients', status_code=201)
def create_patient(p: PatientIn):
    conn = get_conn()
    try:
        cur = conn.execute('INSERT INTO patients(name,date_of_birth,gender,phone,email) VALUES(?,?,?,?,?)',
                           (p.name, p.date_of_birth.isoformat() if p.date_of_birth else None, p.gender, p.phone, p.email))
        conn.commit(); pid = cur.lastrowid
    except sqlite3.IntegrityError as e:
        conn.close(); raise HTTPException(400, str(e))
    conn.close(); return {'patient_id': pid, **p.model_dump(mode='json')}


@app.get('/patients/{patient_id}')
def get_patient(patient_id: int):
    conn = get_conn(); r = conn.execute('SELECT * FROM patients WHERE patient_id=?', (patient_id,)).fetchone(); conn.close()
    if not r: raise HTTPException(404, 'Patient not found')
    return dict(r)


@app.post('/prescriptions', status_code=201)
def create_prescription(p: PrescriptionIn):
    conn = get_conn()
    if not conn.execute('SELECT 1 FROM patients WHERE patient_id=?', (p.patient_id,)).fetchone():
        conn.close(); raise HTTPException(404, 'Patient not found')
    cur = conn.execute('INSERT INTO prescriptions(patient_id,prescription_date,expiry_date,doctor_name,notes) VALUES(?,?,?,?,?)',
        (p.patient_id, p.prescription_date.isoformat(), p.expiry_date.isoformat() if p.expiry_date else None, p.doctor_name, p.notes))
    conn.commit(); pid = cur.lastrowid; conn.close(); return {'prescription_id': pid, **p.model_dump(mode='json')}


@app.post('/prescriptions/medicines', status_code=201)
def add_prescription_medicine(p: PrescriptionMedicineIn):
    conn = get_conn()
    if not conn.execute('SELECT 1 FROM prescriptions WHERE prescription_id=?', (p.prescription_id,)).fetchone():
        conn.close(); raise HTTPException(404, 'Prescription not found')
    if not conn.execute('SELECT 1 FROM medicines WHERE medicine_id=?', (p.medicine_id,)).fetchone():
        conn.close(); raise HTTPException(404, 'Medicine not found')
    try:
        conn.execute('INSERT INTO prescription_medicines VALUES(?,?,?,?)', (p.prescription_id,p.medicine_id,p.prescribed_quantity,p.instructions))
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close(); raise HTTPException(400, str(e))
    conn.close(); return p.model_dump()


@app.get('/patients/{patient_id}/prescriptions')
def patient_prescriptions(patient_id: int):
    conn = get_conn()
    rows = conn.execute('''SELECT p.prescription_id,p.prescription_date,p.expiry_date,p.doctor_name,
                                  m.medicine_id,m.generic_name,m.strength,pm.prescribed_quantity,pm.instructions
                           FROM prescriptions p
                           JOIN prescription_medicines pm ON p.prescription_id=pm.prescription_id
                           JOIN medicines m ON pm.medicine_id=m.medicine_id
                           WHERE p.patient_id=? ORDER BY p.prescription_date DESC''', (patient_id,)).fetchall()
    conn.close(); return [dict(r) for r in rows]


@app.post('/schedules', status_code=201)
def create_schedule(s: ScheduleIn):
    if s.end_date and s.end_date < s.start_date:
        raise HTTPException(400, 'end_date cannot be before start_date')
    conn = get_conn()
    if not conn.execute('SELECT 1 FROM patients WHERE patient_id=?', (s.patient_id,)).fetchone():
        conn.close(); raise HTTPException(404, 'Patient not found')
    if not conn.execute('SELECT 1 FROM medicines WHERE medicine_id=?', (s.medicine_id,)).fetchone():
        conn.close(); raise HTTPException(404, 'Medicine not found')
    cur = conn.execute('''INSERT INTO dosage_schedules
        (patient_id,medicine_id,dosage_per_intake,frequency,scheduled_time,start_date,end_date)
        VALUES(?,?,?,?,?,?,?)''', (s.patient_id,s.medicine_id,s.dosage_per_intake,s.frequency,s.scheduled_time.isoformat(),s.start_date.isoformat(),s.end_date.isoformat() if s.end_date else None))
    conn.commit(); sid=cur.lastrowid; conn.close(); return {'schedule_id':sid, **s.model_dump(mode='json')}


@app.get('/patients/{patient_id}/schedules')
def patient_schedules(patient_id: int):
    conn=get_conn(); rows=conn.execute('''SELECT d.*,m.generic_name,m.strength FROM dosage_schedules d
        JOIN medicines m ON d.medicine_id=m.medicine_id WHERE d.patient_id=? ORDER BY d.scheduled_time''',(patient_id,)).fetchall(); conn.close(); return [dict(r) for r in rows]


@app.post('/medication-history', status_code=201)
def add_history(h: HistoryIn):
    if h.status not in {'Taken','Missed','Snoozed'}:
        raise HTTPException(400, 'status must be Taken, Missed, or Snoozed')
    conn=get_conn()
    if not conn.execute('SELECT 1 FROM patients WHERE patient_id=?',(h.patient_id,)).fetchone():
        conn.close(); raise HTTPException(404,'Patient not found')
    if not conn.execute('SELECT 1 FROM medicines WHERE medicine_id=?',(h.medicine_id,)).fetchone():
        conn.close(); raise HTTPException(404,'Medicine not found')
    cur=conn.execute('''INSERT INTO medication_history(patient_id,medicine_id,schedule_id,scheduled_time,status,taken_at,notes)
        VALUES(?,?,?,?,?,?,?)''',(h.patient_id,h.medicine_id,h.schedule_id,h.scheduled_time.isoformat(),h.status,h.taken_at.isoformat() if h.taken_at else None,h.notes))
    conn.commit(); hid=cur.lastrowid; conn.close(); return {'history_id':hid, **h.model_dump(mode='json')}


@app.get('/patients/{patient_id}/medication-history')
def medication_history(patient_id: int):
    conn=get_conn(); rows=conn.execute('''SELECT h.*,m.generic_name,m.strength FROM medication_history h
        JOIN medicines m ON h.medicine_id=m.medicine_id WHERE h.patient_id=? ORDER BY h.scheduled_time DESC''',(patient_id,)).fetchall(); conn.close(); return [dict(r) for r in rows]


@app.get('/patients/{patient_id}/adherence')
def adherence(patient_id: int):
    conn=get_conn(); row=conn.execute('''SELECT COUNT(*) total,
        SUM(CASE WHEN status='Taken' THEN 1 ELSE 0 END) taken,
        SUM(CASE WHEN status='Missed' THEN 1 ELSE 0 END) missed
        FROM medication_history WHERE patient_id=?''',(patient_id,)).fetchone(); conn.close()
    total=row['total'] or 0; taken=row['taken'] or 0; missed=row['missed'] or 0
    return {'patient_id':patient_id,'total_doses':total,'taken_doses':taken,'missed_doses':missed,'adherence_percentage':round(taken/total*100,2) if total else 0}
