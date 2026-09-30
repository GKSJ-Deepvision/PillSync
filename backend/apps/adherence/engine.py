"""Adherence maths, on plain records so it can be tested without a database.

Definitions - fixed here so every screen, report and export agrees:

* A dose is *resolved* when it is Taken or Missed. Pending and snoozed doses are
  still in progress and count for nothing yet.
* Skipped doses are excluded from adherence altogether. "My doctor told me to
  stop" is not a failure, and counting it either way would make the number lie.
* adherence rate = taken / (taken + missed).
* A taken dose is *on time* if it was recorded within ON_TIME_MINUTES of its
  scheduled time. Taking a morning pill at 3pm counts as taken, not on time.
* A *perfect day* has at least one taken dose and no missed ones. Days with no
  resolved doses are neutral: they neither extend nor break a streak.
* consistency = perfect days / days that had resolved doses.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta

TAKEN, MISSED, SKIPPED = "TAKEN", "MISSED", "SKIPPED"
ON_TIME_MINUTES = 60
#: A pattern needs this many resolved doses before it is called out. Three
#: misses out of four is noise; twelve out of sixteen is a habit.
MIN_SAMPLE = 8
IMPROVING, STABLE, DECLINING, UNKNOWN = "IMPROVING", "STABLE", "DECLINING", "UNKNOWN"
TREND_THRESHOLD = 5.0  # percentage points
#: Resolved doses each half of the window needs before a trend is claimed.
MIN_TREND_DOSES = 6

WEEKDAYS = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
}


@dataclass(frozen=True)
class Record:
    day: date
    slot: str
    status: str
    medicine: str
    delay_minutes: float | None = None  # taken doses only: response minus schedule

    @property
    def weekday(self) -> int:
        return self.day.isoweekday()


def pct(numerator: float, denominator: float) -> float | None:
    if not denominator:
        return None
    return round(100 * numerator / denominator, 1)


def _within(records, start: date, end: date):
    return [r for r in records if start <= r.day <= end]


def totals(records) -> dict:
    taken = sum(1 for r in records if r.status == TAKEN)
    missed = sum(1 for r in records if r.status == MISSED)
    skipped = sum(1 for r in records if r.status == SKIPPED)
    delays = [r.delay_minutes for r in records if r.status == TAKEN and r.delay_minutes is not None]
    on_time = sum(1 for d in delays if abs(d) <= ON_TIME_MINUTES)
    return {
        "taken": taken,
        "missed": missed,
        "skipped": skipped,
        "resolved": taken + missed,
        "adherence_rate": pct(taken, taken + missed),
        "on_time_rate": pct(on_time, len(delays)),
        "average_delay_minutes": round(sum(delays) / len(delays), 1) if delays else None,
    }


def daily_series(records, start: date, end: date) -> list[dict]:
    """One row per calendar day in the range, empty days included, for charting."""
    by_day: dict[date, list[Record]] = defaultdict(list)
    for r in records:
        by_day[r.day].append(r)

    rows, day = [], start
    while day <= end:
        t = totals(by_day.get(day, []))
        rows.append(
            {
                "date": day,
                "taken": t["taken"],
                "missed": t["missed"],
                "skipped": t["skipped"],
                "adherence_rate": t["adherence_rate"],
            }
        )
        day += timedelta(days=1)
    return rows


def _day_outcomes(records) -> dict[date, bool]:
    """day -> perfect?, for days that had at least one resolved dose."""
    taken: dict[date, int] = defaultdict(int)
    missed: dict[date, int] = defaultdict(int)
    for r in records:
        if r.status == TAKEN:
            taken[r.day] += 1
        elif r.status == MISSED:
            missed[r.day] += 1
    return {day: missed[day] == 0 and taken[day] > 0 for day in set(taken) | set(missed)}


def streaks(records) -> dict:
    outcomes = _day_outcomes(records)
    longest = run = 0
    for day in sorted(outcomes):
        run = run + 1 if outcomes[day] else 0
        longest = max(longest, run)

    current = 0
    for day in sorted(outcomes, reverse=True):
        if not outcomes[day]:
            break
        current += 1
    return {"current": current, "longest": longest}


def consistency(records) -> float | None:
    outcomes = _day_outcomes(records)
    return pct(sum(outcomes.values()), len(outcomes))


def trend(records, start: date, end: date) -> dict:
    """Compare the second half of the range with the first.

    Returns UNKNOWN unless both halves have enough resolved doses to compare
    (MIN_TREND_DOSES each): reporting "improving" from one half with no data, or
    "slipping" because of two missed doses out of five, would be invented. A
    seven-day window with one dose a day is exactly that case.
    """
    days = (end - start).days + 1
    unknown = {"direction": UNKNOWN, "change": None, "first_half": None, "second_half": None}
    if days < 4:
        return unknown
    midpoint = start + timedelta(days=days // 2)
    first_half = totals(_within(records, start, midpoint - timedelta(days=1)))
    second_half = totals(_within(records, midpoint, end))
    first, second = first_half["adherence_rate"], second_half["adherence_rate"]
    if first_half["resolved"] < MIN_TREND_DOSES or second_half["resolved"] < MIN_TREND_DOSES:
        return {**unknown, "first_half": first, "second_half": second}
    change = round(second - first, 1)
    direction = (
        IMPROVING
        if change >= TREND_THRESHOLD
        else DECLINING if change <= -TREND_THRESHOLD else STABLE
    )
    return {"direction": direction, "change": change, "first_half": first, "second_half": second}


def _breakdown(records, key) -> dict:
    groups: dict = defaultdict(list)
    for r in records:
        if r.status in (TAKEN, MISSED):
            groups[key(r)].append(r)
    out = {}
    for name, rows in groups.items():
        t = totals(rows)
        out[name] = {
            "taken": t["taken"],
            "missed": t["missed"],
            "resolved": t["resolved"],
            "missed_rate": pct(t["missed"], t["resolved"]),
        }
    return out


def missed_analysis(records) -> dict:
    """Where the misses cluster - by time of day, day of week and medicine."""
    overall = totals(records)
    overall_missed_rate = pct(overall["missed"], overall["resolved"]) or 0.0

    by_slot = _breakdown(records, lambda r: r.slot)
    by_weekday = _breakdown(records, lambda r: r.weekday)
    by_medicine = _breakdown(records, lambda r: r.medicine)

    insights: list[str] = []

    def worst(groups):
        eligible = {k: v for k, v in groups.items() if v["resolved"] >= MIN_SAMPLE and v["missed"]}
        if not eligible:
            return None
        name = max(eligible, key=lambda k: (eligible[k]["missed_rate"], eligible[k]["missed"]))
        # Only worth saying if it is clearly worse than the rest, not just the
        # top of a flat distribution.
        if eligible[name]["missed_rate"] >= overall_missed_rate + 10:
            return name, eligible[name]
        return None

    if found := worst(by_slot):
        slot, s = found
        insights.append(
            f"Most misses happen at {slot.lower()}: {s['missed']} of {s['resolved']} doses "
            f"({s['missed_rate']:.0f}%) were missed."
        )
    if found := worst(by_weekday):
        day, s = found
        insights.append(
            f"{WEEKDAYS[day]}s are the hardest day: {s['missed']} of {s['resolved']} doses missed."
        )
    if found := worst(by_medicine):
        name, s = found
        insights.append(f"{name} is missed most often: {s['missed']} of {s['resolved']} doses.")

    return {
        "overall_missed_rate": overall_missed_rate if overall["resolved"] else None,
        "by_slot": by_slot,
        "by_weekday": {WEEKDAYS[k]: v for k, v in sorted(by_weekday.items())},
        "by_medicine": dict(sorted(by_medicine.items(), key=lambda kv: -kv[1]["missed"])),
        "insights": insights,
    }


def summarise(records, start: date, end: date, *, streak_records=None) -> dict:
    """Everything the adherence screen and the reports show, for one date range."""
    window = _within(records, start, end)
    return {
        "start": start,
        "end": end,
        "days": (end - start).days + 1,
        **totals(window),
        "consistency": consistency(window),
        "streaks": streaks(streak_records if streak_records is not None else records),
        "trend": trend(records, start, end),
    }
