import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize Faker with a static seed if you want the exact same data every time
fake = Faker()
Faker.seed(42) 

def generate_mock_patients(num_patients=5):
    patients = []
    for _ in range(num_patients):
        patients.append({
            "id": fake.uuid4(),
            "name": fake.name(),
            "email": fake.email(),
        })
    return patients

def generate_mock_medicines(patients):
    medicines = []
    medicine_names = ["Metformin", "Lisinopril", "Atorvastatin", "Amoxicillin", "Levothyroxine"]
    
    for patient in patients:
        medicines.append({
            "patient_id": patient["id"],
            "medicine_name": random.choice(medicine_names),
            "total_quantity": random.choice([30, 60, 90]),
            "daily_dosage": random.randint(1, 3),
            "start_date": fake.date_between(start_date="-15d", end_date="today")
        })
    return medicines

if __name__ == "__main__":
    print("Generating Mock Data for AI Refill Engine...\n")
    
    mock_patients = generate_mock_patients(3)
    mock_medicines = generate_mock_medicines(mock_patients)
    
    for med in mock_medicines:
        # Simulating 10 days of medicine consumption
        days_passed = 10 
        consumed = med["daily_dosage"] * days_passed
        remaining_stock = med["total_quantity"] - consumed
        
        print(f"Patient ID: {med['patient_id'][:8]}... | Medicine: {med['medicine_name']}")
        print(f"Total: {med['total_quantity']} | Daily Dose: {med['daily_dosage']} | Remaining: {remaining_stock}\n")
        
    print("Seeding complete! This logic will be connected to your PostgreSQL tables soon.")