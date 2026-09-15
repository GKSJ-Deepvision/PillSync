import { Link } from "react-router-dom";
import { REFILL_STATUS_LABEL } from "../../features/refills/mlApi";

const STATUS_DOT = {
  ok: "bg-mint",
  low: "bg-[#F59E0B]",
  empty: "bg-rose",
  "no-schedule": "bg-ink/20",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Compact "what needs a refill soon" card driven by the ML refill-prediction
 * API. Used on both the Patient dashboard (own medicines) and the Caregiver
 * dashboard / patient-details view (a linked patient's medicines) — same
 * component, same predictions, so the two roles never see conflicting
 * numbers for the same medicine.
 */
export default function RefillOutlookCard({
  predictions = [],
  loading = false,
  linkTo = "/refills",
  title = "Refill outlook",
}) {
  const urgent = predictions.filter((p) => p.stock_status === "low" || p.stock_status === "empty");
  const adherenceWatch = predictions.filter(
    (p) => p.adherence_risk === "watch" || p.adherence_risk === "declining"
  );
  const soonest = [...predictions]
    .sort((a, b) => (a.days_remaining ?? Infinity) - (b.days_remaining ?? Infinity))
    .slice(0, 3);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {linkTo && (
          <Link
            to={linkTo}
            className="font-body text-[13px] font-semibold"
            style={{ color: "var(--brand-deep)" }}
          >
            View all →
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-3 font-body text-sm text-ink-fog">Checking stock & adherence…</p>
      ) : predictions.length === 0 ? (
        <p className="mt-3 font-body text-sm text-ink-fog">No medicines tracked yet.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {urgent.length > 0 && (
              <span className="badge bg-coral-soft text-coral-deep">
                {urgent.length} need{urgent.length === 1 ? "s" : ""} a refill soon
              </span>
            )}
            {adherenceWatch.length > 0 && (
              <span className="badge bg-[#FEF3C7] text-[#B45309]">
                {adherenceWatch.length} adherence risk{adherenceWatch.length === 1 ? "" : "s"}
              </span>
            )}
            {urgent.length === 0 && adherenceWatch.length === 0 && (
              <span className="badge bg-mint-soft text-mint-deep">All medicines stocked</span>
            )}
          </div>

          <ul className="mt-3 divide-y divide-ink/5">
            {soonest.map((p) => (
              <li key={p.medication_id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_DOT[p.stock_status]}`}
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-ink">
                    {p.medication_name || "Medicine"}
                  </span>
                </div>
                <span className="font-body text-xs text-ink-fog">
                  {p.days_remaining != null
                    ? `${p.days_remaining}d left · runs out ${formatDate(p.depletion_date)}`
                    : REFILL_STATUS_LABEL[p.stock_status]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
