# OCR evaluation

Synthetic set: **40 prescriptions, 120 medicines**, seed 11. Drug names, strengths and forms come from the seeded FDA catalogue; each line is written in one of 7 common prescribing styles (1-0-1, 0-0-1, 1-1-1, BD, TDS, OD, "twice daily"), about a quarter using a brand name instead of the generic.

Each condition renders the prescription to an image, reads it with real Tesseract (the engine the app uses), parses it, and scores it against the known contents.

## Field-level accuracy

Accuracy of a field = correct / medicines that were found. "Found" is the share of the real medicines that were extracted at all.

| Condition | Medicines found | Name | Strength | Doses per day | Exact time slots | Course length | Mean OCR confidence |
|---|---:|---:|---:|---:|---:|---:|---:|
| text only | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | - |
| clean | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0.95 |
| skewed | 100.0% | 100.0% | 99.2% | 95.0% | 87.9% | 98.3% | 0.93 |
| degraded | 22.5% | 85.2% | 92.6% | 48.1% | 50.0% | 44.4% | 0.30 |

## Catalogue matching

Whether an extracted medicine was matched to the right catalogue drug. Only a *confident* match is applied automatically; a doubtful one is shown to the patient as a suggestion. The number to watch is **wrong automatic matches**: the case where the app attaches the wrong drug without asking.

| Condition | Correct automatic matches | Wrong automatic matches | Suggested only (page read badly) | Spurious extra items |
|---|---:|---:|---:|---:|
| text only | 95.8% | 0 (0.0%) | 0 | 0 |
| clean | 95.8% | 0 (0.0%) | 0 | 0 |
| skewed | 95.8% | 0 (0.0%) | 0 | 0 |
| degraded | 0.0% | 0 (0.0%) | 23 | 2 |

## What these numbers do and do not show

- Rendered text is far easier than a photograph. Treat the *clean* row as an upper bound and the *degraded* row as a stress test, not as what a patient's phone will produce.
- One typeface, no handwriting, no paper texture, no glare, no shadows, no curved pages. Handwritten prescriptions, which are common, are outside what Tesseract can read reliably.
- The parser is tuned on real prescribing conventions but scored on this generator's styles; a style it has never seen would score lower. The review screen exists for that reason.
- The set is synthetic by necessity: real prescriptions are medical records and cannot be committed or shared.
