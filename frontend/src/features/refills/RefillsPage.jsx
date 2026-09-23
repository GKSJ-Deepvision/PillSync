import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  basisNote,
  daysLeftText,
  shortDate,
  stockBarPercent,
  urgency,
  URGENCY_STYLES,
} from "../../lib/refill";
import {
  ArrowLeftIcon,
  ChartIcon,
  AlertCircleIcon,
} from "../../components/icons";

const SETUP_HINT =
  "Refill prediction needs the Milestone 3 database update. Run docs/database/schema-milestone3.sql in the Supabase SQL editor.";

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400";

export default function RefillsPage() {
  const { user } = useAuth();

  const [forecast, setForecast] = useState([]);
  const [uncounted, setUncounted] = useState([]);
  const [alertsSent, setAlertsSent] = useState(0);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;

    setError(null);
    setLoading(true);

    const f = await supabase.rpc("refill_forecast", {
      p_patient: user.id,
    });

    if (f.error) {
      setError(
        f.error.code === "PGRST202" || /function/i.test(f.error.message)
          ? SETUP_HINT
          : f.error.message
      );
      setLoading(false);
      return;
    }

    setForecast(f.data ?? []);

    const meds = await supabase
      .from("medications")
      .select("id, name, quantity_on_hand, frequency_per_day")
      .eq("patient_id", user.id)
      .eq("active", true)
      .is("quantity_on_hand", null);

    setUncounted(
      (meds.data ?? []).filter((m) => m.frequency_per_day > 0)
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load().then(async () => {
      const { data } = user
        ? await supabase.rpc("check_refills", {
            p_patient: user.id,
          })
        : { data: 0 };

      setAlertsSent(data ?? 0);
    });
  }, [load, user]);

  const setAmount = (id, value) => {
    setAmounts((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const bought = async (id) => {
    const n = Number(amounts[`b${id}`]);

    if (!n) return;

    const { error: e } = await supabase
      .from("stock_adjustments")
      .insert({
        medication_id: id,
        delta: n,
        reason: "refill purchase",
      });

    if (e) {
      setError(e.message);
      return;
    }

    setAmount(`b${id}`, "");
    load();
  };

  const recount = async (id) => {
    const raw = amounts[`c${id}`];

    if (raw === "" || raw === undefined) return;

    const { error: e } = await supabase
      .from("medications")
      .update({
        quantity_on_hand: Math.round(Number(raw)),
      })
      .eq("id", id);

    if (e) {
      setError(e.message);
      return;
    }

    setAmount(`c${id}`, "");
    load();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10 space-y-6">

        {/* Back */}
        <Link
          to="/medications"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon />
          Medicines
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="heading text-2xl md:text-3xl font-bold text-gray-900">
              Refills
            </h1>

            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Track your remaining medicine stock and see when you may need
              your next refill.
            </p>
          </div>

          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white items-center justify-center shadow-lg shadow-amber-200">
            <ChartIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <p className="text-sm text-gray-600">
            Remaining stock is your last count minus the doses you marked as
            taken. The run-out date adjusts to how many doses you really take.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Alerts */}
        {alertsSent > 0 && (
          <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
            {alertsSent} low-stock alert
            {alertsSent === 1 ? "" : "s"} sent to your notifications and your
            caregivers.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500">
              Calculating refill forecast…
            </p>
          </div>
        )}

        {/* Forecast */}
        {!loading && forecast.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Refill forecast
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Based on your current stock and recorded medication usage.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {forecast.map((f) => {
                const level = urgency(f.days_left);
                const style = URGENCY_STYLES[level];

                return (
                  <div
                    key={f.medication_id}
                    className={`rounded-2xl p-5 shadow-sm border space-y-4 ${style.card}`}
                  >
                    {/* Medicine name + urgency */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {f.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Refill forecast
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-xs font-medium flex items-center gap-1 ${style.text}`}
                      >
                        {(level === "low" || level === "empty") && (
                          <AlertCircleIcon className="w-4 h-4" />
                        )}

                        {style.label}
                      </span>
                    </div>

                    {/* Stock bar */}
                    <div className="h-3 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className={`h-full ${style.bar}`}
                        style={{
                          width: `${stockBarPercent(f.days_left)}%`,
                        }}
                      />
                    </div>

                    {/* Stock information */}
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">
                        {daysLeftText(f.days_left)} ·{" "}
                        {Number(f.remaining)} left ·{" "}
                        {Number(f.daily_use)}/day
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Runs out around {shortDate(f.depletion_date)} · order
                        by {shortDate(f.refill_by)}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {basisNote(f)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="flex gap-2 items-end">
                        <label className="flex-1 text-xs text-gray-500">
                          I bought

                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 30"
                            className={`${input} mt-1`}
                            value={
                              amounts[`b${f.medication_id}`] ?? ""
                            }
                            onChange={(e) =>
                              setAmount(
                                `b${f.medication_id}`,
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <button
                          onClick={() => bought(f.medication_id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex gap-2 items-end">
                        <label className="flex-1 text-xs text-gray-500">
                          Recount now

                          <input
                            type="number"
                            min="0"
                            placeholder="tablets left"
                            className={`${input} mt-1`}
                            value={
                              amounts[`c${f.medication_id}`] ?? ""
                            }
                            onChange={(e) =>
                              setAmount(
                                `c${f.medication_id}`,
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <button
                          onClick={() => recount(f.medication_id)}
                          className="bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Uncounted medicines */}
        {uncounted.length > 0 && (
          <section className="bg-white rounded-2xl border border-dashed border-amber-200 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Add a stock count
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add the current quantity for these medicines to predict their
                refill dates.
              </p>
            </div>

            <div className="space-y-3">
              {uncounted.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"
                >
                  <span className="flex-1 text-sm font-medium text-gray-700">
                    {m.name}
                  </span>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="0"
                      placeholder="tablets on hand"
                      className="w-full sm:w-44 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                      value={amounts[`c${m.id}`] ?? ""}
                      onChange={(e) =>
                        setAmount(`c${m.id}`, e.target.value)
                      }
                    />

                    <button
                      onClick={() => recount(m.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          forecast.length === 0 &&
          uncounted.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-10 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <ChartIcon className="w-7 h-7 text-amber-500" />
              </div>

              <h2 className="text-base font-semibold text-gray-900">
                No refill forecast yet
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                Add a medicine with a stock count to see its refill forecast.
              </p>

              <Link
                to="/medications"
                className="inline-flex mt-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Go to Medicines
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}