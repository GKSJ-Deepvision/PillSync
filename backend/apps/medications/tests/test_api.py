from secrets import token_urlsafe

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.medications.models import Medicine

TEST_PASSWORD = token_urlsafe(24)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient():
    return User.objects.create_user(
        email="patient1@example.com",
        full_name="Patient One",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )


@pytest.fixture
def second_patient():
    return User.objects.create_user(
        email="patient2@example.com",
        full_name="Patient Two",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )


@pytest.fixture
def caregiver():
    return User.objects.create_user(
        email="caregiver@example.com",
        full_name="Caregiver",
        password=TEST_PASSWORD,
        role=UserRole.CAREGIVER,
    )


@pytest.fixture
def medicine(patient):
    return Medicine.objects.create(
        patient=patient,
        medicine_name="Amlodipine",
        generic_name="Amlodipine",
        dosage="5.00",
        dosage_form="Tablet",
        quantity=30,
        disease_category="BLOOD_PRESSURE",
        is_active=True,
    )


@pytest.mark.django_db
def test_patient_can_create_medicine(api_client, patient):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    data = {
        "medicine_name": "Metformin",
        "generic_name": "Metformin",
        "dosage": "500.00",
        "dosage_form": "Tablet",
        "quantity": 30,
        "disease_category": "DIABETES",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 201
    assert response.data["medicine_name"] == "Metformin"
    assert response.data["patient"] == patient.id


@pytest.mark.django_db
def test_patient_can_view_medicines(api_client, patient, medicine):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    response = api_client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["id"] == medicine.id


@pytest.mark.django_db
def test_patient_can_view_one_medicine(api_client, patient, medicine):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-detail", args=[medicine.id])

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == medicine.id
    assert response.data["medicine_name"] == "Amlodipine"


@pytest.mark.django_db
def test_patient_can_update_medicine(api_client, patient, medicine):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-detail", args=[medicine.id])

    data = {
        "medicine_name": "Amlodipine Updated",
        "generic_name": "Amlodipine",
        "dosage": "10.00",
        "dosage_form": "Tablet",
        "quantity": 25,
        "disease_category": "BLOOD_PRESSURE",
        "is_active": True,
    }

    response = api_client.put(url, data, format="json")

    assert response.status_code == 200
    assert response.data["medicine_name"] == "Amlodipine Updated"
    assert response.data["dosage"] == "10.00"
    assert response.data["quantity"] == 25


@pytest.mark.django_db
def test_patient_can_patch_medicine(api_client, patient, medicine):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-detail", args=[medicine.id])

    response = api_client.patch(
        url,
        {"quantity": 20},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["quantity"] == 20


@pytest.mark.django_db
def test_patient_can_delete_medicine(api_client, patient, medicine):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-detail", args=[medicine.id])

    response = api_client.delete(url)

    assert response.status_code == 204
    assert not Medicine.objects.filter(id=medicine.id).exists()


@pytest.mark.django_db
def test_patient_cannot_access_another_patients_medicine(
    api_client,
    patient,
    second_patient,
    medicine,
):
    api_client.force_authenticate(user=second_patient)

    url = reverse("medication-detail", args=[medicine.id])

    response = api_client.get(url)

    assert response.status_code == 404


@pytest.mark.django_db
def test_non_patient_cannot_create_medicine(api_client, caregiver):
    api_client.force_authenticate(user=caregiver)

    url = reverse("medication-list")

    data = {
        "medicine_name": "Amlodipine",
        "generic_name": "Amlodipine",
        "dosage": "5.00",
        "dosage_form": "Tablet",
        "quantity": 30,
        "disease_category": "BLOOD_PRESSURE",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 403


@pytest.mark.django_db
def test_cannot_create_medicine_with_negative_quantity(api_client, patient):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    data = {
        "medicine_name": "Amlodipine",
        "generic_name": "Amlodipine",
        "dosage": "5.00",
        "dosage_form": "Tablet",
        "quantity": -5,
        "disease_category": "BLOOD_PRESSURE",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 400


@pytest.mark.django_db
def test_cannot_create_medicine_with_negative_dosage(api_client, patient):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    data = {
        "medicine_name": "Amlodipine",
        "generic_name": "Amlodipine",
        "dosage": "-5.00",
        "dosage_form": "Tablet",
        "quantity": 30,
        "disease_category": "BLOOD_PRESSURE",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 400


@pytest.mark.django_db
def test_cannot_create_medicine_without_name(api_client, patient):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    data = {
        "generic_name": "Amlodipine",
        "dosage": "5.00",
        "dosage_form": "Tablet",
        "quantity": 30,
        "disease_category": "BLOOD_PRESSURE",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 400


@pytest.mark.django_db
def test_cannot_create_medicine_with_invalid_disease_category(api_client, patient):
    api_client.force_authenticate(user=patient)

    url = reverse("medication-list")

    data = {
        "medicine_name": "Amlodipine",
        "generic_name": "Amlodipine",
        "dosage": "5.00",
        "dosage_form": "Tablet",
        "quantity": 30,
        "disease_category": "INVALID_CATEGORY",
        "is_active": True,
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 400
