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
        meds = Medication.objects.all().order_by("-id")
        serializer = MedicationSerializer(meds, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = MedicationSerializer(data=request.data)
        if serializer.is_valid():
            med = serializer.save()
            med.update_stock_days()
            med.save()
            return Response(MedicationSerializer(med).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            return Response(MedicationSerializer(updated_med).data)
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

    med.stock = max(0, med.stock - 1)
    med.update_stock_days()
    med.save()
    return Response(MedicationSerializer(med).data)


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
