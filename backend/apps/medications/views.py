import requests
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Medication
from .serializers import MedicationSerializer


def _get_user_role(user):
    """Determine the role of a user (admin, caregiver, patient)."""
    if not user or not user.is_authenticated:
        return "patient"
    if getattr(user, "_role", None):
        return user._role
    if user.is_superuser or user.is_staff:
        return "admin"
    try:
        group_names = set(user.groups.values_list("name", flat=True))
        for r in ("admin", "caregiver", "patient"):
            if r in group_names:
                return r
    except Exception:
        pass
    email = (user.email or user.username or "").lower()
    if "caregiver" in email or "doctor" in email:
        return "caregiver"
    return "patient"


def _get_queryset_for_user(user):
    """
    Return the appropriate Medication queryset based on the user's role.

    - Admin: sees ALL medications.
    - Caregiver: sees medications for their assigned patients OR medications
      they directly added (caregiver FK). Falls back to all if none exist yet.
    - Patient: sees medications assigned to them (patient FK or legacy assigned_patient_id).
      Falls back to unassigned demo medications if none assigned yet.
    - Unauthenticated: falls back to all (dev/demo mode).
    """
    if not user or not user.is_authenticated:
        # Dev/demo fallback — return all
        return Medication.objects.all().order_by("-id")

    role = _get_user_role(user)

    if role == "admin":
        return Medication.objects.all().order_by("-id")

    if role == "caregiver":
        from apps.accounts.models import CaregiverPatientAssignment

        assigned_patient_ids = list(
            CaregiverPatientAssignment.objects.filter(caregiver=user).values_list(
                "patient_id", flat=True
            )
        )

        qs = Medication.objects.filter(
            Q(patient_id__in=assigned_patient_ids) | Q(caregiver=user)
        )
        return qs.order_by("-id")

    # Patient role: ONLY medicines assigned to this patient
    qs = Medication.objects.filter(
        Q(patient=user) | Q(assigned_patient_id=str(user.id))
    )
    if not qs.exists():
        unassigned = Medication.objects.filter(patient__isnull=True, caregiver__isnull=True)
        return unassigned.order_by("-id")
    return qs.order_by("-id")


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def medication_list_create(request):
    """
    GET: List medications filtered by the requesting user's role.
         Optionally filtered by ?patient_id=<id> for specific patient medications.
    POST: Create a new medication. Caregivers can specify a patient;
          patients can only add for themselves.
    """
    if request.method == "GET":
        meds = _get_queryset_for_user(request.user)
        patient_id_filter = request.query_params.get("patient_id")
        if patient_id_filter:
            meds = meds.filter(
                Q(patient_id=patient_id_filter) | Q(assigned_patient_id=str(patient_id_filter))
            )
        serializer = MedicationSerializer(meds, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        user = request.user
        role = _get_user_role(user) if user and user.is_authenticated else "anonymous"

        data = request.data.copy()

        # Resolve patient assignment
        if role == "patient":
            # Patients always add for themselves
            data["patient_id"] = user.id
            data["caregiver_id"] = None
        elif role == "caregiver":
            # Caregivers specify a patient_id; default caregiver = self
            if not data.get("caregiver_id"):
                data["caregiver_id"] = user.id
            specified_patient_id = data.get("patient_id")
            if specified_patient_id:
                from apps.accounts.models import CaregiverPatientAssignment

                CaregiverPatientAssignment.objects.get_or_create(
                    caregiver=user,
                    patient_id=specified_patient_id,
                    defaults={"note": "Auto-linked via medication assignment"},
                )
        # Admin or anonymous: no restriction

        serializer = MedicationSerializer(data=data)
        if serializer.is_valid():
            med = serializer.save()
            med.update_stock_days()
            med.save()
            sync_reminders_for_medication(med)
            med_data = MedicationSerializer(med).data
            return Response(med_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def sync_reminders_for_medication(med):
    import datetime

    from apps.reminders.models import Reminder

    today = datetime.date.today()

    default_times = {
        "Morning": "08:00 AM",
        "Afternoon": "01:00 PM",
        "Night": "09:00 PM",
    }

    timing_details = med.timing_details or {}

    for period in med.times_of_day or ["Morning"]:
        time_str = timing_details.get(period) or default_times.get(period, "08:00 AM")
        Reminder.objects.get_or_create(
            medication=med,
            period=period,
            scheduled_date=today,
            defaults={
                "name": med.name,
                "dosage": med.dosage,
                "time": time_str,
                "food_timing": med.food_timing,
                "disease": med.disease_category,
                "status": "pending",
            },
        )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def medication_detail(request, pk):
    """
    GET / PUT / DELETE a single medication.
    Access control:
      - Patients can only GET their own meds; cannot PUT/DELETE.
      - Caregivers can GET/PUT/DELETE meds for their assigned patients.
      - Admins have full access.
    """
    try:
        med = Medication.objects.get(pk=pk)
    except Medication.DoesNotExist:
        return Response({"detail": "Medication not found."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    role = _get_user_role(user) if user and user.is_authenticated else "anonymous"

    # Access check
    if user and user.is_authenticated and role == "patient":
        if med.patient_id != user.id:
            return Response(
                {"detail": "You do not have permission to access this medication."},
                status=status.HTTP_403_FORBIDDEN,
            )

    if user and user.is_authenticated and role == "caregiver":
        from apps.accounts.models import CaregiverPatientAssignment

        patient_ids = list(
            CaregiverPatientAssignment.objects.filter(caregiver=user).values_list(
                "patient_id", flat=True
            )
        )
        if med.patient_id not in patient_ids and med.caregiver_id != user.id:
            return Response(
                {"detail": "You do not have permission to access this medication."},
                status=status.HTTP_403_FORBIDDEN,
            )

    if request.method == "GET":
        return Response(MedicationSerializer(med).data)

    # Patients cannot modify medications
    if role == "patient":
        return Response(
            {"detail": "Patients cannot modify medications."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "PUT":
        serializer = MedicationSerializer(med, data=request.data, partial=True)
        if serializer.is_valid():
            updated_med = serializer.save()
            updated_med.update_stock_days()
            updated_med.save()
            sync_reminders_for_medication(updated_med)
            med_data = MedicationSerializer(updated_med).data
            return Response(med_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        med.delete()
        return Response({"status": "deleted"}, status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def take_dose(request, pk):
    try:
        med = Medication.objects.get(pk=pk)
    except Medication.DoesNotExist:
        return Response({"detail": "Medication not found."}, status=status.HTTP_404_NOT_FOUND)

    # Patients can only log doses for their own meds
    user = request.user
    if user and user.is_authenticated:
        role = _get_user_role(user)
        if role == "patient" and med.patient_id != user.id:
            return Response(
                {"detail": "You can only log doses for your own medications."},
                status=status.HTTP_403_FORBIDDEN,
            )

    med_data = MedicationSerializer(med).data
    med_data["status"] = "taken"
    return Response(med_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def fda_drug_search(request):
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response({"results": []})

    results = []

    # 1. Query OpenFDA NDC API
    try:
        fda_url = f'https://api.fda.gov/drug/ndc.json?search=brand_name:"{query}"+generic_name:"{query}"&limit=10'
        fda_res = requests.get(fda_url, timeout=5)
        if fda_res.status_code == 200:
            fda_data = fda_res.json()
            for item in fda_data.get("results", []):
                brand_name = item.get("brand_name", "")
                generic_name = item.get("generic_name", "")
                active_ingredients = item.get("active_ingredients", [])
                dosage_form = item.get("dosage_form_name", "")
                labeler = item.get("labeler_name", "")
                ndc = item.get("product_ndc", "")

                strength = ""
                if active_ingredients and len(active_ingredients) > 0:
                    strength = active_ingredients[0].get("strength", "")

                results.append(
                    {
                        "id": f"fda-{ndc}",
                        "name": brand_name or generic_name,
                        "genericName": generic_name,
                        "dosage": strength or "Standard Dose",
                        "dosageForm": dosage_form,
                        "manufacturer": labeler,
                        "ndc": ndc,
                        "source": "OpenFDA National Drug Code Database",
                    }
                )
    except Exception as e:
        print("OpenFDA fetch error:", e)

    # 2. Fallback / Supplement with RxNorm API if OpenFDA returned few results
    if len(results) < 3:
        try:
            rx_url = f"https://rxnav.nlm.nih.gov/REST/drugs.json?name={query}"
            rx_res = requests.get(rx_url, timeout=5)
            if rx_res.status_code == 200:
                rx_data = rx_res.json()
                drug_concepts = rx_data.get("drugGroup", {}).get("conceptGroup", [])
                for group in drug_concepts:
                    for concept in group.get("conceptProperties", [])[:5]:
                        name = concept.get("name", "")
                        rxcui = concept.get("rxcui", "")
                        if not any(r["name"].lower() == name.lower() for r in results):
                            results.append(
                                {
                                    "id": f"rxcui-{rxcui}",
                                    "name": name,
                                    "genericName": name,
                                    "dosage": "Standard Rx Dose",
                                    "dosageForm": "Tablet / Capsule",
                                    "manufacturer": "RxNorm Verified Drug",
                                    "ndc": rxcui,
                                    "source": "NIH RxNorm Database",
                                }
                            )
        except Exception as e:
            print("RxNorm fetch error:", e)

    return Response({"results": results[:10]})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def mongo_store_view(request):
    """
    API endpoint to store and retrieve document values in MongoDB.
    """
    from config.mongo import list_documents, store_document

    if request.method == "POST":
        collection = request.data.get("collection", "general_store")
        data = request.data.get("data", {})
        if not isinstance(data, dict) or not data:
            return Response(
                {"detail": "'data' field must be a non-empty dictionary object."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            doc_id = store_document(collection, data)
            return Response(
                {"status": "stored", "inserted_id": doc_id, "collection": collection},
                status=status.HTTP_201_CREATED,
            )
        except Exception as err:
            return Response(
                {"detail": f"Failed to store in MongoDB: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    elif request.method == "GET":
        collection = request.query_params.get("collection", "general_store")
        try:
            docs = list_documents(collection, limit=50)
            return Response({"collection": collection, "count": len(docs), "results": docs})
        except Exception as err:
            return Response(
                {"detail": f"Failed to fetch from MongoDB: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
