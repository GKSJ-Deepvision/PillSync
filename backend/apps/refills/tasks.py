from apps.refills.services.prediction import RefillPredictionService


def check_and_generate_low_stock_alerts():
    """Background task to scan stock levels and generate notifications when remaining supply is low."""
    service = RefillPredictionService()
    low_stock_list = service.get_low_stock_medications()
    alerts_generated = []

    for item in low_stock_list:
        alert = {
            "medication_id": item["medicationId"],
            "name": item["medicationName"],
            "effective_stock_days": item["effectiveStockDays"],
            "status": item["status"],
            "message": f"Your medicine {item['medicationName']} is expected to run out in {item['effectiveStockDays']} days ({item['depletionDate']}). Please reorder stock.",
        }
        alerts_generated.append(alert)

    return alerts_generated
