import requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Medication
from .serializers import MedicationSerializer


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def medication_list_create(request):
    if request.method == "GET":
        from config.mongo import list_documents

        # Try fetching from MongoDB first if available
        try:
            mongo_meds = list_documents("developer", limit=100)
            if not mongo_meds:
                mongo_meds = list_documents("medications", limit=100)
            if mongo_meds:
                # Format MongoDB documents to match medication response schema
                formatted = []
                for m in mongo_meds:
                    formatted.append(
                        {
                            "id": m.get("id") or m.get("_id"),
                            "name": m.get("name", "Unknown"),
                            "dosage": m.get("dosage", "500 mg"),
                            "stock": m.get("stock", 30),
                            "total_stock": m.get("total_stock", 60),
                            "frequency": m.get("frequency", "1 time daily"),
                            "disease_category": m.get("disease_category", "General"),
                            "times_of_day": m.get("times_of_day", ["Morning"]),
                            "stock_days": m.get("stock_days", 30),
                            "refill_threshold": m.get("refill_threshold", 10),
                            "fda_ndc": m.get("fda_ndc", ""),
                            "manufacturer": m.get("manufacturer", ""),
                            "active_ingredient": m.get("active_ingredient", ""),
                            "created_at": m.get("created_at", ""),
                        }
                    )
                return Response(formatted)
        except Exception as e:
            print("MongoDB fetch warning (falling back to local DB):", e)

        meds = Medication.objects.all().order_by("-id")
        serializer = MedicationSerializer(meds, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = MedicationSerializer(data=request.data)
        if serializer.is_valid():
            med = serializer.save()
            med.update_stock_days()
            med.save()
            sync_reminders_for_medication(med)

            med_data = MedicationSerializer(med).data
            # Sync to MongoDB 'medicin' database (collections 'developer' and 'medications')
            try:
                from config.mongo import store_document

                store_document("developer", dict(med_data))
                store_document("medications", dict(med_data))
            except Exception as err:
                print("Failed to sync new medication to MongoDB:", err)

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
    try:
        med = Medication.objects.get(pk=pk)
    except Medication.DoesNotExist:
        return Response({"detail": "Medication not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(MedicationSerializer(med).data)

    elif request.method == "PUT":
        serializer = MedicationSerializer(med, data=request.data, partial=True)
        if serializer.is_valid():
            updated_med = serializer.save()
            updated_med.update_stock_days()
            updated_med.save()
            sync_reminders_for_medication(updated_med)
            med_data = MedicationSerializer(updated_med).data

            # Sync update to MongoDB
            try:
                from config.mongo import get_mongo_db

                db = get_mongo_db()
                db["developer"].update_one(
                    {"id": updated_med.id}, {"$set": dict(med_data)}, upsert=True
                )
                db["medications"].update_one(
                    {"id": updated_med.id}, {"$set": dict(med_data)}, upsert=True
                )
            except Exception as err:
                print("Failed to sync update to MongoDB:", err)

            return Response(med_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        med_id = med.id
        med.delete()
        # Delete from MongoDB
        try:
            from config.mongo import delete_document

            delete_document("developer", {"id": med_id})
            delete_document("medications", {"id": med_id})
        except Exception as err:
            print("Failed to delete from MongoDB:", err)

        return Response({"status": "deleted"}, status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def take_dose(request, pk):
    try:
        med = Medication.objects.get(pk=pk)
    except Medication.DoesNotExist:
        return Response({"detail": "Medication not found."}, status=status.HTTP_404_NOT_FOUND)

    med.stock = max(0, med.stock - 1)
    med.update_stock_days()
    med.save()
    med_data = MedicationSerializer(med).data

    # Sync update to MongoDB
    try:
        from config.mongo import get_mongo_db

        db = get_mongo_db()
        db["developer"].update_one({"id": med.id}, {"$set": dict(med_data)}, upsert=True)
        db["medications"].update_one({"id": med.id}, {"$set": dict(med_data)}, upsert=True)
    except Exception as err:
        print("Failed to sync dose update to MongoDB:", err)

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
