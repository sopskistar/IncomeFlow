"use client";
import { useState, useSyncExternalStore } from "react";
const subscribe = () => () => {};
import { allocate, amountText } from "@/lib/domain";
import { parseUnits } from "viem";
export function AllocationPreview() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [amount, setAmount] = useState("1000");
  const [spending, setSpending] = useState(50);
  const [savings, setSavings] = useState(30);
  const taxes = 100 - spending - savings;
  const valid =
    /^\d{1,9}(\.\d{0,6})?$/.test(amount) &&
    spending > 0 &&
    savings > 0 &&
    taxes > 0;
  const values = valid
    ? allocate(parseUnits(amount, 6), [
        spending * 100,
        savings * 100,
        taxes * 100,
      ])
    : [0n, 0n, 0n];
  return (
    <div className="allocation-preview">
      <div className="preview-top">
        <span>Try an allocation</span>
        <span className="tag">Interactive preview · No transaction</span>
      </div>
      <label className="preview-input">
        Incoming payment
        <span>
          <input
            disabled={!hydrated}
            aria-label="Illustrative payment amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span>ifUSD</span>
        </span>
      </label>
      <div className="allocation-strip" aria-hidden="true">
        <i style={{ flex: spending }} />
        <i style={{ flex: savings }} />
        <i style={{ flex: Math.max(0, taxes) }} />
      </div>
      <div className="preview-allocations">
        {["Spending", "Savings", "Tax reserve"].map((name, i) => (
          <div key={name}>
            <span className={`category-icon category-${i}`} aria-hidden="true">
              {i + 1}
            </span>
            <label htmlFor={`preview-${i}`}>{name}</label>
            <span className="share-input">
              {i < 2 ? (
                <input
                  disabled={!hydrated}
                  id={`preview-${i}`}
                  aria-label={`${name} sample percentage`}
                  type="number"
                  min="1"
                  max={i === 0 ? 98 : 99 - spending}
                  value={i === 0 ? spending : savings}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (i === 0) {
                      setSpending(n);
                      if (n + savings >= 100) setSavings(Math.max(1, 99 - n));
                    } else setSavings(n);
                  }}
                />
              ) : (
                <span id={`preview-${i}`}>{taxes}</span>
              )}
              %
            </span>
            <strong>{valid ? amountText(values[i]) : "—"}</strong>
          </div>
        ))}
      </div>
      <p className="muted small">
        Adjust the amounts. This calculator sends no transaction.
      </p>
    </div>
  );
}
