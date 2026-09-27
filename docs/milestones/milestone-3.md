## My Milestone 3 Task — Adherence Analytics

* **Intern:** Ruchitha Puru
* **Branch:** `intern/20-ruchitha-puru`
* **Submitted on:** 27 September 2026

### Evaluation criteria

| Criterion                                                             | Status               | Evidence                                                                                                                                   |
| --------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| OCR medicine recognition operational                                  | Not my assigned task | —                                                                                                                                          |
| Extraction of name, dosage, quantity, frequency, prescription details | Not my assigned task | —                                                                                                                                          |
| AI refill prediction system functional                                | Not my assigned task | —                                                                                                                                          |
| **Medication adherence tracking completed**                           | **Done**             | `backend/apps/adherence/`                                                                                                                  |
| Refill notifications working correctly                                | Not my assigned task | —                                                                                                                                          |
| Low-stock alerts                                                      | Not my assigned task | —                                                                                                                                          |
| **Adherence analytics (daily history, percentage, trends)**           | **Done**             | `backend/apps/adherence/services/metrics.py`, `backend/apps/adherence/views.py`, `frontend/src/features/adherence/pages/AdherencePage.jsx` |

## Adherence implementation

Implemented a complete medication adherence tracking and analytics workflow using real medication schedule and dose data.

The system tracks:

* Taken doses
* Missed doses
* Pending doses
* Daily medication history
* Overall adherence percentage
* Medication-level adherence
* Adherence trends
* Current adherence streak
* Today's dose status
* CSV report export

The workflow is:

**Medication Schedule → Dose Due → Patient Records Taken/Missed → Dose Event → Adherence Calculation → Analytics Dashboard**

The adherence percentage is calculated from completed doses:

**Adherence % = Taken Doses / (Taken Doses + Missed Doses) × 100**

Pending future doses are excluded from the completed-dose calculation.

## Adherence dashboard

The frontend provides:

* Last 7 days
* Last 30 days
* Custom date range
* Overall adherence percentage
* Taken / missed / pending summary
* Daily adherence trend chart
* Dose-status visualization
* Today's doses with dose-recording actions
* Medication-level adherence breakdown
* Daily history
* CSV export

## Dose recording

Users can record today's medication status directly from the adherence dashboard.

For example:

**Norvasc — 8:00 AM → Mark taken → Recorded at 2:06 PM**

The recorded dose is sent to the backend and the dashboard refreshes the adherence calculations automatically.

## Tests

### Test files

* `backend/apps/adherence/tests/test_adherence_metrics.py`
* `backend/apps/adherence/tests/test_api.py`

### Coverage

Tests cover:

* Adherence metric calculations
* Daily history generation
* Taken and missed doses
* Pending doses
* Medication-level adherence
* Dose logging APIs
* Validation
* Patient access and ownership
* API behavior

### Test result

**37 tests passed**

Additional checks:

* Django system check — Passed
* Ruff — Passed
* Black — Passed
* isort — Passed
* ESLint — Passed
* Frontend build — Passed
* Secret scan — verified during CI fixes

## Blockers and open questions

**None for the Adherence Analytics task.**
