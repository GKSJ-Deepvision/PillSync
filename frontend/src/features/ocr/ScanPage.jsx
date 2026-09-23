import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { scanPrescription } from "../../lib/apiClient";
import { cardToRow, prepareCards, validateCard } from "../../lib/ocrMapping";
import {
  ArrowLeftIcon,
  PillIcon,
  AlertCircleIcon,
  PlusIcon,
  CrossIcon,
} from "../../components/icons";

const CATEGORIES = [
  "Blood Pressure",
  "Diabetes",
  "Thyroid",
  "Antibiotics",
  "Vitamins",
  "Heart",
  "Other",
];

const input =
  "mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400";

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [scan, setScan] = useState(null);
  const [cards, setCards] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];

    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setScan(null);
    setCards([]);
    setConfirmed(false);
    setStatus("idle");
    setError(null);
  };

  const handleScan = async () => {
    if (!file) return;

    setStatus("scanning");
    setError(null);

    try {
      const data = await scanPrescription({
        imageFile: file,
      });

      setScan(data);
      setCards(prepareCards(data.medicines));
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const update = (id, patch) => {
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
            }
          : c
      )
    );
  };

  const setTime = (c, i, v) => {
    update(c.id, {
      times: c.times.map((t, j) =>
        j === i ? v : t
      ),
    });
  };

  const included = cards.filter((c) => c.include);

  const problems = included.flatMap((c) =>
    validateCard(c)
  );

  const canSave =
    included.length > 0 &&
    problems.length === 0 &&
    confirmed &&
    status !== "saving";

  const handleSave = async () => {
    setStatus("saving");
    setError(null);

    const { error: dbError } = await supabase
      .from("medications")
      .insert(
        included.map((c) =>
          cardToRow(c, user.id)
        )
      );

    if (dbError) {
      setError(dbError.message);
      setStatus("done");
      return;
    }

    navigate("/medications");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-50 via-white to-sky-50">
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
              Scan a prescription
            </h1>

            <p className="text-sm text-gray-500 mt-1 max-w-4xl">
              Upload a prescription or medicine label
              (printed or handwritten). Every medicine on
              it is read separately, and you check each one
              before anything is saved.
            </p>
          </div>

          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-600 text-white items-center justify-center shadow-lg shadow-violet-200">
            <PillIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Upload medicine image
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Use a clear photo of the prescription or
              medicine package.
            </p>
          </div>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 bg-gray-50"
          />

          {preview && (
            <div className="flex justify-center bg-gray-50 rounded-xl border border-gray-100 p-4">
              <img
                src={preview}
                alt="Selected prescription"
                className="max-h-80 max-w-full rounded-lg border border-gray-200 object-contain"
              />
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file || status === "scanning"}
            className="w-full bg-gradient-to-br from-violet-500 to-sky-600 text-white font-medium px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
          >
            {status === "scanning"
              ? "Reading prescription…"
              : "Scan image"}
          </button>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        {/* Scan results */}
        {scan && (
          <div className="space-y-5">

            {/* Scan information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">

                <span className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 font-medium">
                  {scan.source === "vision"
                    ? "Read by AI vision (handwriting)"
                    : "Read by text recognition"}
                </span>

                <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                  {scan.medicine_count} medicine
                  {scan.medicine_count === 1
                    ? ""
                    : "s"}{" "}
                  found
                </span>

                {scan.doctor && (
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                    {scan.doctor}
                  </span>
                )}

                {scan.prescription_date && (
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                    {scan.prescription_date}
                  </span>
                )}

                {scan.expires_on && (
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                    Expires {scan.expires_on}
                  </span>
                )}
              </div>
            </div>

            {/* Warnings */}
            {scan.warnings?.length > 0 && (
              <div className="space-y-2">
                {scan.warnings.map((w) => (
                  <p
                    key={w}
                    className="flex gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4"
                  >
                    <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* No medicines */}
            {cards.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-violet-200 p-8 text-sm text-gray-600 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center">
                  <PillIcon className="w-6 h-6 text-violet-500" />
                </div>

                <p>
                  No medicines could be read from this
                  image.
                </p>

                <Link
                  to="/medications/new"
                  className="inline-flex text-violet-600 font-medium hover:text-violet-700"
                >
                  Add a medicine manually
                </Link>
              </div>
            )}

            {/* Medicine results */}
            {cards.length > 0 && (
              <section className="space-y-4">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    What we read
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Review the extracted medicine information
                    before saving it.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {cards.map((c) => {
                    const errs = c.include
                      ? validateCard(c)
                      : [];

                    return (
                      <div
                        key={c.id}
                        className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm ${
                          c.include
                            ? "border-emerald-200"
                            : "border-gray-100 opacity-60"
                        }`}
                      >

                        {/* Card header */}
                        <div className="flex items-center justify-between gap-3">

                          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <input
                              type="checkbox"
                              checked={c.include}
                              onChange={(e) =>
                                update(c.id, {
                                  include:
                                    e.target.checked,
                                })
                              }
                              className="w-4 h-4"
                            />

                            Add this medicine
                          </label>

                          {c.needs_review && (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                              Check carefully
                            </span>
                          )}
                        </div>

                        {/* Medicine fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                          <label className="md:col-span-2 text-xs text-gray-500">
                            Name

                            <input
                              className={input}
                              value={c.name}
                              onChange={(e) =>
                                update(c.id, {
                                  name: e.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="text-xs text-gray-500">
                            Strength

                            <input
                              className={input}
                              value={c.strength || ""}
                              onChange={(e) =>
                                update(c.id, {
                                  strength:
                                    e.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="text-xs text-gray-500">
                            Per dose (tablets)

                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              className={input}
                              value={c.units_per_dose}
                              onChange={(e) =>
                                update(c.id, {
                                  units_per_dose:
                                    e.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="text-xs text-gray-500">
                            Total quantity

                            <input
                              type="number"
                              min="0"
                              className={input}
                              value={c.quantity ?? ""}
                              onChange={(e) =>
                                update(c.id, {
                                  quantity:
                                    e.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="text-xs text-gray-500">
                            Category

                            <select
                              className={input}
                              value={
                                c.disease_category
                              }
                              onChange={(e) =>
                                update(c.id, {
                                  disease_category:
                                    e.target.value,
                                })
                              }
                            >
                              <option value="">
                                —
                              </option>

                              {CATEGORIES.map(
                                (cat) => (
                                  <option
                                    key={cat}
                                    value={cat}
                                  >
                                    {cat}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        </div>

                        {/* Reminder times */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            {c.as_needed
                              ? "As needed - no fixed reminders"
                              : "Reminder times"}

                            {c.duration_days
                              ? ` · ${c.duration_days} days`
                              : ""}

                            {c.food_instruction
                              ? ` · ${c.food_instruction}`
                              : ""}
                          </p>

                          {!c.as_needed && (
                            <div className="flex flex-wrap gap-2 items-center">

                              {c.times.map(
                                (t, i) => (
                                  <span
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <input
                                      type="time"
                                      value={t}
                                      onChange={(e) =>
                                        setTime(
                                          c,
                                          i,
                                          e.target.value
                                        )
                                      }
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                    />

                                    <button
                                      type="button"
                                      aria-label="Remove time"
                                      onClick={() =>
                                        update(
                                          c.id,
                                          {
                                            times:
                                              c.times.filter(
                                                (_, j) =>
                                                  j !==
                                                  i
                                              ),
                                          }
                                        )
                                      }
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <CrossIcon />
                                    </button>
                                  </span>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  update(c.id, {
                                    times: [
                                      ...c.times,
                                      "08:00",
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs text-violet-600 font-medium hover:text-violet-700"
                              >
                                <PlusIcon />
                                Add time
                              </button>
                            </div>
                          )}
                        </div>

                        {/* OCR warnings */}
                        {(c.warnings || []).map(
                          (w) => (
                            <p
                              key={w}
                              className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2"
                            >
                              ⚠ {w}
                            </p>
                          )
                        )}

                        {/* Validation errors */}
                        {errs.map((e) => (
                          <p
                            key={e}
                            className="text-xs text-red-600 bg-red-50 rounded-lg p-2"
                          >
                            {e}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Confirmation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

                  <label className="flex gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) =>
                        setConfirmed(
                          e.target.checked
                        )
                      }
                      className="mt-1 w-4 h-4"
                    />

                    <span>
                      I have checked every medicine
                      above against my prescription.
                      Text recognition can misread
                      names and doses.
                    </span>
                  </label>

                  <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-medium py-3 rounded-lg disabled:opacity-50"
                  >
                    {status === "saving"
                      ? "Saving…"
                      : `Save ${
                          included.length
                        } medicine${
                          included.length === 1
                            ? ""
                            : "s"
                        }`}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}