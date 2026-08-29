-- PillSync Database Schema

-- 1. USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENTS
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    medical_conditions TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 3. CAREGIVERS
CREATE TABLE caregivers (
    caregiver_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 4. CAREGIVER-PATIENT CONNECTION
CREATE TABLE caregiver_patients (
    id SERIAL PRIMARY KEY,
    caregiver_id INT NOT NULL,
    patient_id INT NOT NULL,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(caregiver_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    UNIQUE(caregiver_id, patient_id)
);

-- 5. MEDICINES
CREATE TABLE medicines (
    medicine_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    dosage VARCHAR(50),
    dosage_form VARCHAR(50),
    quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- 6. PRESCRIPTIONS
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    image_path TEXT,
    medicine_name VARCHAR(150),
    dosage VARCHAR(50),
    quantity INT,
    frequency VARCHAR(50),
    prescription_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- 7. MEDICATION SCHEDULES
CREATE TABLE medication_schedules (
    schedule_id SERIAL PRIMARY KEY,
    medicine_id INT NOT NULL,
    scheduled_time TIME NOT NULL,
    dosage_quantity INT NOT NULL,
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- 8. MEDICATION HISTORY
CREATE TABLE medication_history (
    history_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    patient_id INT NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    taken_time TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    quantity_taken INT DEFAULT 0,
    FOREIGN KEY (schedule_id) REFERENCES medication_schedules(schedule_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- 9. REFILLS
CREATE TABLE refills (
    refill_id SERIAL PRIMARY KEY,
    medicine_id INT NOT NULL,
    initial_quantity INT,
    remaining_quantity INT,
    daily_consumption DECIMAL(10,2),
    missed_doses INT DEFAULT 0,
    estimated_finish_date DATE,
    recommended_refill_date DATE,
    status VARCHAR(20),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_id INT,
    notification_type VARCHAR(50),
    message TEXT,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);