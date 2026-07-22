// ─────────────────────────────────────────────
//  KhetiBahi – BuyerHistoryModal
//
//  Answers "what have I bought from you?" — pick a buyer,
//  see every sale to them: date, crop, kg, rate, total
//  amount, and any note. Income page only.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, User, Package, Loader2, Inbox } from "lucide-react";
import { formatNPR, prettyDate } from "@/app/utils/helpers";
import { CROPS } from "@/app/utils/constants";

interface BuyerRecord {
  id: string;
  date: string;
  crop: string;
  buyer: string;
  quantityKg: number;
  ratePerKg: number;
  amount: number;
  amountPaid: number;
  note: string;
}

interface BuyerSummary {
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  totalKg: number;
  count: number;
}

interface BuyerHistoryModalProps {
  onClose: () => void;
}

export default function BuyerHistoryModal({ onClose }: BuyerHistoryModalProps) {
  const [buyerNames, setBuyerNames] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<BuyerRecord[] | null>(null);
  const [summary, setSummary] = useState<BuyerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load every buyer name once, for the suggestion list under the search box
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/income/buyers");
        if (res.ok) setBuyerNames(await res.json());
      } catch (err) {
        console.error("Could not load buyer list:", err);
      }
    })();
  }, []);

  const lookup = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/income/buyer?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        setError("Could not load this buyer's history.");
        setRecords(null);
        setSummary(null);
        return;
      }
      const body = await res.json();
      setRecords(body.records);
      setSummary(body.summary);
    } catch (err) {
      console.error(err);
      setError("Could not load this buyer's history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handlePick(name: string) {
    setSelected(name);
    setQuery(name);
    lookup(name);
  }

  function handleSearchSubmit() {
    if (query.trim()) handlePick(query.trim());
  }

  const suggestions = buyerNames.filter(
    (b) => query.trim() && b.toLowerCase().includes(query.trim().toLowerCase()) && b !== selected
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line flex-shrink-0">
          <h2 className="text-lg font-display font-bold text-ink flex items-center gap-2">
            <User className="w-5 h-5 text-brand" />
            Buyer History
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Search box */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Buyer name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder="e.g. Ram Krishi Pasal"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            {/* Suggestions from buyers already on record */}
            {!selected && suggestions.length > 0 && (
              <div className="mt-1.5 border border-line rounded-xl overflow-hidden divide-y divide-line max-h-40 overflow-y-auto">
                {suggestions.slice(0, 6).map((name) => (
                  <button
                    key={name}
                    onClick={() => handlePick(name)}
                    className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {!selected && query.trim() && suggestions.length === 0 && buyerNames.length > 0 && (
              <button
                onClick={handleSearchSubmit}
                className="text-xs text-brand font-medium mt-1.5 hover:underline"
              >
                No exact match on record — search &quot;{query.trim()}&quot; anyway
              </button>
            )}
          </div>

          {/* Results */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-ink-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Looking up sales…
            </div>
          )}

          {error && <p className="text-negative text-sm">{error}</p>}

          {!isLoading && summary && records && (
            <>
              {records.length === 0 ? (
                <div className="text-center py-10">
                  <Inbox className="w-7 h-7 text-ink-faint mx-auto mb-2" />
                  <p className="text-sm text-ink-muted">No sales found for this buyer.</p>
                </div>
              ) : (
                <>
                  {/* Summary strip */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-surface-2 rounded-xl p-3">
                      <p className="text-[11px] text-ink-faint mb-0.5">Total bought</p>
                      <p className="text-sm font-display font-bold text-ink tabular-nums">
                        {formatNPR(summary.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3">
                      <p className="text-[11px] text-ink-faint mb-0.5">Total kg</p>
                      <p className="text-sm font-display font-bold text-ink tabular-nums">
                        {summary.totalKg} kg
                      </p>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3">
                      <p className="text-[11px] text-ink-faint mb-0.5">Still due</p>
                      <p
                        className={`text-sm font-display font-bold tabular-nums ${
                          summary.totalDue > 0 ? "text-negative" : "text-brand"
                        }`}
                      >
                        {formatNPR(summary.totalDue)}
                      </p>
                    </div>
                  </div>

                  {/* Per-sale list */}
                  <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden">
                    {records.map((r) => {
                      const cropMeta = CROPS.find((c) => c.value === r.crop);
                      return (
                        <div key={r.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand whitespace-nowrap">
                                  {cropMeta?.emoji} {r.crop}
                                </span>
                                <span className="text-xs text-ink-faint tabular-nums">{prettyDate(r.date)}</span>
                              </div>
                              <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {r.quantityKg}kg × {formatNPR(r.ratePerKg)}/kg
                              </p>
                              {r.note && <p className="text-xs text-ink-faint mt-1 italic">&quot;{r.note}&quot;</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-ink tabular-nums">{formatNPR(r.amount)}</p>
                              {r.amountPaid < r.amount && (
                                <p className="text-[11px] text-negative tabular-nums">
                                  {formatNPR(r.amount - r.amountPaid)} due
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {!isLoading && !summary && !error && (
            <p className="text-xs text-ink-faint text-center py-6">
              Type or pick a buyer above to see everything they&apos;ve bought.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
