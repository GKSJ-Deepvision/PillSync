CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(30),
    phone VARCHAR(30),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
    medicine_id SERIAL PRIMARY KEY,
    generic_name VARCHAR(255) NOT NULL UNIQUE,
    drug_class TEXT,
    indications TEXT,
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    route_of_administration VARCHAR(100),
    side_effects TEXT,
    contraindications TEXT,
    interaction_warnings_precautions TEXT,
    storage_conditions TEXT,
    pregnancy_category TEXT,
    reference TEXT,
    availability VARCHAR(100)
);

CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    expiry_date DATE,
    doctor_name VARCHAR(150),
    notes TEXT
);

CREATE TABLE prescription_medicines (
    prescription_id INT REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medicine_id INT REFERENCES medicines(medicine_id),
    prescribed_quantity INT CHECK (prescribed_quantity >= 0),
    instructions TEXT,
    PRIMARY KEY (prescription_id, medicine_id)
);

CREATE TABLE dosage_schedules (
    schedule_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(medicine_id),
    dosage_per_intake NUMERIC(10,2) NOT NULL CHECK (dosage_per_intake > 0),
    frequency VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE medication_history (
    history_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(medicine_id),
    schedule_id INT REFERENCES dosage_schedules(schedule_id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Taken','Missed','Snoozed')),
    taken_at TIMESTAMP,
    notes TEXT
);
