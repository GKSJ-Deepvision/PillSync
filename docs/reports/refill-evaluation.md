# Refill prediction evaluation

Simulated cohort: 1000 patients (200 of each of 5 behaviours), seed 7. Forecasts are made at days 7, 14, 21 using only earlier history, and compared with the day the simulated stock actually hit zero.

## Run-out date error

Error = predicted day minus actual day. Negative means the predictor said "sooner" than the patient really ran out.

| Estimator | Forecasts | Mean abs. error (days) | Bias (days) | Within ±2 days | Within ±5 days |
|---|---:|---:|---:|---:|---:|
| schedule only | 2684 | 8.87 | -8.87 | 31.0% | 54.7% |
| observed only | 2684 | 5.57 | -2.14 | 56.8% | 77.1% |
| blend, full weight at 5 doses | 2684 | 5.57 | -2.14 | 56.8% | 77.1% |
| blend, full weight at 10 doses (used) | 2684 | 5.32 | -2.73 | 57.3% | 77.8% |
| blend, full weight at 20 doses | 2684 | 5.56 | -4.54 | 55.2% | 75.9% |
| blend, full weight at 40 doses | 2684 | 6.77 | -6.62 | 47.7% | 68.1% |

## Error by behaviour (estimator used in the app)

| Behaviour | Schedule only: mean abs. error | Blended: mean abs. error |
|---|---:|---:|
| steady | 1.18 | 1.12 |
| typical | 4.69 | 2.87 |
| forgetful | 15.08 | 6.77 |
| weekend skipper | 6.82 | 2.99 |
| fading | 16.08 | 12.78 |

## Do warnings arrive in time?

A warning fires when status reaches LOW (run-out within 5 days). "Too early" means more than 12 days' notice, which teaches patients to ignore it.

| Estimator | Warned before running out | Median notice (days) | Warned too early |
|---|---:|---:|---:|
| schedule only | 100.0% | 7.0 | 1.0% |
| blend, full weight at 10 doses (used) | 100.0% | 6.0 | 0.0% |

## Reading these results

- The blend beats the schedule alone in every behaviour group, and roughly ties it for patients who take everything - which is the reason to learn from history at all.
- Patients whose habits are *changing* stay hard to forecast (the 'fading' group): a two-week window lags a downward trend, so their run-out date is still off by about a week and a half. A trend term is the obvious next step.
- Every estimator is biased early (it says "sooner"). For a refill reminder that is the safe direction: a patient is told slightly too soon, not too late.
- The history weight is not sensitive: 5, 10 and 20 doses differ by well under a day of mean error. What matters is using history at all; the exact weight barely does.
- The simulated behaviours are invented. This shows the method works and how the estimators rank; it is **not** the accuracy real patients would see.
- Doses are assumed to be recorded faithfully. A patient who takes tablets but does not tap "taken" looks like a low consumer, so the forecast runs late for them.
