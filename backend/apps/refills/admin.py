from django.contrib import admin

from .models import RefillPrediction, StockEvent


@admin.register(RefillPrediction)
class RefillPredictionAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "patient",
        "status",
        "days_remaining",
        "depletion_date",
        "alert_level",
    )
    list_filter = ("status",)
    search_fields = ("medicine__name", "patient__full_name")
    readonly_fields = ("computed_at",)


@admin.register(StockEvent)
class StockEventAdmin(admin.ModelAdmin):
    list_display = ("medicine", "kind", "quantity_delta", "quantity_after", "actor", "created_at")
    list_filter = ("kind",)
    search_fields = ("medicine__name",)
