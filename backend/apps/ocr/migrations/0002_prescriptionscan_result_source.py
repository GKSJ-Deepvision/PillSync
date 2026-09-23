from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ocr", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="prescriptionscan",
            name="result",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="prescriptionscan",
            name="source",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]