# reminders — Module 4: Smart Reminder System

**Implement here**
- Reminder generation from medication schedules (morning / afternoon / night)
- Repeated reminder scheduling and snooze handling
- Reminder actions: **Taken**, **Missed**, **Snoozed** (these feed `adherence`)
- Delivery channel fan-out to push (FCM), email (SendGrid) and SMS (Twilio)
- Background job scheduling (Celery beat / APScheduler / Django-Q)

**Expected files:** `models.py`, `tasks.py`, `serializers.py`, `views.py`, `urls.py`, `services/`, `tests/`

**Milestone:** 2 (Week 3–4)
