const defaultCaregiverProfile = {
  phone: "+91 91234 56789",
  relation: "Sister",
  address: "Bengaluru, Karnataka",
  contactTime: "Evenings"
};

let caregiverProfileData = JSON.parse(localStorage.getItem("pillsync_caregiver_profile")) || defaultCaregiverProfile;

function loadProfile() {
  document.getElementById("fPhone-view").textContent = caregiverProfileData.phone;
  document.getElementById("fRelation-view").textContent = caregiverProfileData.relation;
  document.getElementById("fAddress-view").textContent = caregiverProfileData.address;
  document.getElementById("fContactTime-view").textContent = caregiverProfileData.contactTime;

  document.getElementById("fPhone-input").value = caregiverProfileData.phone;
  document.getElementById("fRelation-input").value = caregiverProfileData.relation;
  document.getElementById("fAddress-input").value = caregiverProfileData.address;
  document.getElementById("fContactTime-input").value = caregiverProfileData.contactTime;
}

function toggleEdit() {
  ["Phone", "Relation", "Address", "ContactTime"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "none";
    document.getElementById(`f${f}-edit`).style.display = "inline-block";
  });
  document.getElementById("editActions").style.display = "flex";
  document.getElementById("editBtn").style.display = "none";
}

function cancelEdit() {
  loadProfile();
  ["Phone", "Relation", "Address", "ContactTime"].forEach(f => {
    document.getElementById(`f${f}-view`).style.display = "inline-block";
    document.getElementById(`f${f}-edit`).style.display = "none";
  });
  document.getElementById("editActions").style.display = "none";
  document.getElementById("editBtn").style.display = "inline-block";
}

function saveProfile() {
  caregiverProfileData = {
    phone: document.getElementById("fPhone-input").value,
    relation: document.getElementById("fRelation-input").value,
    address: document.getElementById("fAddress-input").value,
    contactTime: document.getElementById("fContactTime-input").value
  };
  localStorage.setItem("pillsync_caregiver_profile", JSON.stringify(caregiverProfileData));
  loadProfile();
  cancelEdit();
}

loadProfile();