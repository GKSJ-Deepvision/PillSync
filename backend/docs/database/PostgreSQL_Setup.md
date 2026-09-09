\# PostgreSQL Setup



\## 1. Overview



PillSync uses PostgreSQL as the primary relational database for storing user, profile, medication, prescription, dosage, caregiver, and medication history data.



The backend connects to PostgreSQL using SQLAlchemy and the PostgreSQL `psycopg2` driver.



\## 2. Database Configuration



The database connection is configured using the `DATABASE\_URL` environment variable.



Example:



```env

DATABASE\_URL=postgresql://username:password@localhost:5432/pillsync

