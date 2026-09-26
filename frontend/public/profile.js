const defaultProfile = {
  phone: "+91 98765 43210",
  age: "34",
  blood: "O+",
  conditions: "Diabetes, Hypertension"
};

let profileData = JSON.parse(localStorage.getItem("pillsync_patient_profile")) || defaultProfile;

function loadProfile() {
  document.getElementById("fPhone-view").textContent = profileData.phone;
  document.getElementById("fAge-view").textContent = profileData.age;
  document.getElementById("fBlood-view").textContent = profileData.blood;
  document.getElementById("fConditions-view").textContent = profileData.conditions;

  document.getElementById("fPhone-input").value = profileData.phone;
  document.getElementById("fAge-input").value = profileData.age;
  document.getElementById("fBlood-input").value = profileData.blood;
  document.getElementById("fConditions-input").value = profileData.conditions;
}

function toggleEdit() {
  ["Phone", "Age", "Blood", "Conditions"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "none";
    document.getElementById(`f${f}-edit`).style.display = "inline-block";
  });
  document.getElementById("editActions").style.display = "flex";
  document.getElementById("editBtn").style.display = "none";
}

function cancelEdit() {
  loadProfile();
  ["Phone", "Age", "Blood", "Conditions"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "inline-block";
    document.getElementById(`f${f}-edit`).style.display = "none";
  });
  document.getElementById("editActions").style.display = "none";
  document.getElementById("editBtn").style.display = "inline-block";
}

function saveProfile() {
  profileData = {
    phone: document.getElementById("fPhone-input").value,
    age: document.getElementById("fAge-input").value,
    blood: document.getElementById("fBlood-input").value,
    conditions: document.getElementById("fConditions-input").value
  };
  localStorage.setItem("pillsync_patient_profile", JSON.stringify(profileData));
  loadProfile();
  cancelEdit();
}
const defaultProfile2 = {
  gender: "Female",
  dob: "1992-03-14",
  address: "Bengaluru, Karnataka",
  occupation: "Software Engineer",
  allergies: "Penicillin",
  doctor: "Dr. Kavita Rao",
  doctorPhone: "+91 90000 12345"
};

let profileData2 = JSON.parse(localStorage.getItem("pillsync_patient_profile2")) || defaultProfile2;

function formatDob(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function loadProfile2() {
  document.getElementById("fGender-view").textContent = profileData2.gender;
  document.getElementById("fDob-view").textContent = formatDob(profileData2.dob);
  document.getElementById("fAddress-view").textContent = profileData2.address;
  document.getElementById("fOccupation-view").textContent = profileData2.occupation;
  document.getElementById("fAllergies-view").textContent = profileData2.allergies;
  document.getElementById("fDoctor-view").textContent = profileData2.doctor;
  document.getElementById("fDoctorPhone-view").textContent = profileData2.doctorPhone;

  document.getElementById("fGender-input").value = profileData2.gender;
  document.getElementById("fDob-input").value = profileData2.dob;
  document.getElementById("fAddress-input").value = profileData2.address;
  document.getElementById("fOccupation-input").value = profileData2.occupation;
  document.getElementById("fAllergies-input").value = profileData2.allergies;
  document.getElementById("fDoctor-input").value = profileData2.doctor;
  document.getElementById("fDoctorPhone-input").value = profileData2.doctorPhone;
}

function toggleEdit2() {
  ["Gender", "Dob", "Address", "Occupation", "Allergies", "Doctor", "DoctorPhone"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "none";
    document.getElementById(`f${f}-edit`).style.display = "inline-block";
  });
  document.getElementById("editActions2").style.display = "flex";
  document.getElementById("editBtn2").style.display = "none";
}

function cancelEdit2() {
  loadProfile2();
  ["Gender", "Dob", "Address", "Occupation", "Allergies", "Doctor", "DoctorPhone"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "inline-block";
    document.getElementById(`f${f}-edit`).style.display = "none";
  });
  document.getElementById("editActions2").style.display = "none";
  document.getElementById("editBtn2").style.display = "inline-block";
}

function saveProfile2() {
  profileData2 = {
    gender: document.getElementById("fGender-input").value,
    dob: document.getElementById("fDob-input").value,
    address: document.getElementById("fAddress-input").value,
    occupation: document.getElementById("fOccupation-input").value,
    allergies: document.getElementById("fAllergies-input").value,
    doctor: document.getElementById("fDoctor-input").value,
    doctorPhone: document.getElementById("fDoctorPhone-input").value
  };
  localStorage.setItem("pillsync_patient_profile2", JSON.stringify(profileData2));
  loadProfile2();
  cancelEdit2();
}

loadProfile2();

loadProfile();