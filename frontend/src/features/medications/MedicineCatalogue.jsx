import { useCallback, useState } from 'react';

import referenceApi from '../../api/reference.js';
import Alert from '../../components/common/Alert.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Input from '../../components/common/Input.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useApi } from '../../hooks/useApi.js';

/**
 * Search and browse the seeded FDA catalogue.
 *
 * From Milestone 2 this is where a patient picks the medicine they are adding
 * to a schedule, and in Milestone 3 it is what OCR output is matched against -
 * so search and category filtering are worth getting right now.
 */
export default function MedicineCatalogue() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const fetchCategories = useCallback(() => referenceApi.categories(), []);
  const fetchMedicines = useCallback(
    () =>
      referenceApi.medicines({
        search: submitted || undefined,
        category: category || undefined,
        page,
      }),
    [submitted, category, page]
  );

  const categories = useApi(fetchCategories);
  const medicines = useApi(fetchMedicines);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSubmitted(query.trim());
  }

  function chooseCategory(code) {
    setPage(1);
    setCategory((current) => (current === code ? '' : code));
  }

  const results = medicines.data?.results ?? [];
  const total = medicines.data?.count ?? 0;

  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          placeholder="metformin, atorvastatin, vitamin D…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-64 flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {!categories.loading && (
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? [])
            .filter((row) => row.medicine_count > 0)
            .map((row) => (
              <button
                key={row.code}
                type="button"
                aria-pressed={category === row.code}
                onClick={() => chooseCategory(row.code)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  category === row.code
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'
                }`}
              >
                {row.label} <span className="tabular-nums opacity-70">({row.medicine_count})</span>
              </button>
            ))}
        </div>
      )}

      {medicines.error && <Alert tone="error">{medicines.error.message}</Alert>}

      <Card title={`${total} medicine${total === 1 ? '' : 's'}`}>
        {medicines.loading ? (
          <Spinner label="Searching the catalogue" />
        ) : results.length === 0 ? (
          <EmptyState
            title="Nothing matched"
            description="Try a generic name such as 'metformin', or clear the category filter."
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {results.map((medicine) => (
                <li key={medicine.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {medicine.generic_name}
                      {medicine.strength && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          {medicine.strength} {medicine.strength_unit}
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Badge tone="brand">{medicine.category_display}</Badge>
                      {medicine.requires_prescription && <Badge tone="warning">Prescription</Badge>}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[medicine.brand_name, medicine.dosage_form, medicine.route]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {medicine.pharm_class && (
                    <p className="mt-0.5 text-xs text-slate-400">{medicine.pharm_class}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                disabled={!medicines.data?.previous}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!medicines.data?.next}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
