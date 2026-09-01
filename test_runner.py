import os
import sys
import time
import subprocess
import psycopg2

PG_EXE = r"C:\Users\hp\OneDrive\Desktop\ap gvt\school\backend\pgsql\bin\postgres.exe"
PG_DATA = r"C:\Users\hp\OneDrive\Desktop\ap gvt\school\backend\pgsql\data"
PID_FILE = os.path.join(PG_DATA, "postmaster.pid")

def can_connect_db():
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="",
            host="127.0.0.1",
            port=5432,
            connect_timeout=2
        )
        conn.close()
        return True
    except Exception:
        return False

def clean_pid():
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
            print("Removed stale postmaster.pid")
        except Exception as e:
            print(f"Could not remove PID file: {e}")

def main():
    pg_process = None
    if not can_connect_db():
        print("PostgreSQL is not accepting connections. Starting server...")
        clean_pid()
        pg_process = subprocess.Popen([PG_EXE, "-D", PG_DATA])
        
        # Wait for database to accept queries
        for _ in range(30):
            time.sleep(1)
            if can_connect_db():
                print("PostgreSQL is fully ready and accepting connections.")
                break
        else:
            print("Failed to connect to PostgreSQL within timeout.")
            if pg_process:
                pg_process.terminate()
            sys.exit(1)
    else:
        print("PostgreSQL is already running and ready.")

    try:
        # Run Django tests with --no-input
        cmd = [sys.executable, "manage.py", "test", "authentication", "--no-input"]
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd)
        sys.exit(result.returncode)
    finally:
        if pg_process:
            print("Stopping PostgreSQL...")
            pg_process.terminate()
            pg_process.wait()

if __name__ == "__main__":
    main()
