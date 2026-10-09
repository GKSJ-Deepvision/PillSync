# Backend tests

- `unit/` — pure logic: refill maths, adherence percentages, serializers, validators
- `integration/` — API endpoints through the test client, auth flows, DB behaviour
- `fixtures/` — shared pytest fixtures, factories and sample payloads

App-specific tests can also live in `backend/apps/<app>/tests/`. Both locations are
collected by `pytest`.

Name test files `test_*.py` and test functions `test_*`. Every module you implement
needs at least a few meaningful tests — CI reports coverage on each push.
