from django.urls import path

from .views import OCRView

urlpatterns = [
    path("", OCRView.as_view(), name="ocr"),
]
