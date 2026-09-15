"""Quick test for predict_adherence_risk() — run from backend directory."""
import sys
sys.path.insert(0, '.')
from ml.predict import predict_adherence_risk

tests = [
    ("LOW-like (high adherence)", {
        'age': 45, 'gender': 'F', 'num_medications': 2, 'doses_per_day': 2,
        'previous_7day_adherence': 92.0, 'previous_14day_adherence': 90.0,
        'previous_21day_adherence': 88.0,
        'previous_21day_taken': 50, 'previous_21day_missed': 4, 'previous_21day_snoozed': 2,
        'miss_rate': 7.1, 'snooze_rate': 3.6, 'consecutive_missed': 0,
    }),
    ("HIGH-like (poor adherence)", {
        'age': 70, 'gender': 'M', 'num_medications': 5, 'doses_per_day': 3,
        'previous_7day_adherence': 28.0, 'previous_14day_adherence': 32.0,
        'previous_21day_adherence': 30.0,
        'previous_21day_taken': 18, 'previous_21day_missed': 40, 'previous_21day_snoozed': 5,
        'miss_rate': 63.5, 'snooze_rate': 7.9, 'consecutive_missed': 5,
    }),
    ("MEDIUM-like (moderate adherence)", {
        'age': 35, 'gender': 'M', 'num_medications': 3, 'doses_per_day': 2,
        'previous_7day_adherence': 64.0, 'previous_14day_adherence': 68.0,
        'previous_21day_adherence': 66.0,
        'previous_21day_taken': 37, 'previous_21day_missed': 15, 'previous_21day_snoozed': 6,
        'miss_rate': 26.8, 'snooze_rate': 10.7, 'consecutive_missed': 2,
    }),
]

print("=" * 60)
print("PREDICTION FUNCTION TEST")
print("=" * 60)
all_ok = True
valid_risks = {'LOW', 'MEDIUM', 'HIGH'}
for label, features in tests:
    result = predict_adherence_risk(features)
    ok = result.get('available') and result.get('risk_level') in valid_risks
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_ok = False
    print(f"  [{status}] {label}: risk_level={result.get('risk_level')} available={result.get('available')}")

print()
if all_ok:
    print("All 3 prediction tests PASSED.")
else:
    print("Some tests FAILED.")
    sys.exit(1)

# Show top features
result = predict_adherence_risk(tests[0][1])
print("\nTop features (from RF model):")
for f in result.get('top_features', []):
    print(f"  {f['feature']}: {f['importance']:.4f}")
print("=" * 60)
