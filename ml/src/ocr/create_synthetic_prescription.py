import os
from PIL import Image, ImageDraw, ImageFont

# Define path for synthetic image
output_path = os.path.join(os.path.dirname(__file__), "sample_prescription.png")

# Create a blank white image
img = Image.new('RGB', (600, 400), color='white')
d = ImageDraw.Draw(img)

# Try to use a basic font, otherwise default
try:
    font = ImageFont.truetype("arial.ttf", 24)
    title_font = ImageFont.truetype("arial.ttf", 32)
except IOError:
    font = ImageFont.load_default()
    title_font = ImageFont.load_default()

# Add text simulating a prescription
text = """
Dr. John Smith, MD
123 Medical Center Blvd

Patient: Jane Doe
Date: 2026-09-20

Rx:
Lisinopril 10mg
Take one tablet by mouth daily
Quantity: 30
Refills: 2
"""

d.text((20, 20), "PRESCRIPTION", fill=(0, 0, 0), font=title_font)
d.text((20, 70), text.strip(), fill=(0, 0, 0), font=font)

# Save the image
img.save(output_path)
print(f"Created synthetic prescription at: {output_path}")
