"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "newest",  label: "Newest" },
  { value: "forked",  label: "Most forked" },
  { value: "snapped", label: "Most snapped" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "updated";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    router.push(`/explore?${next.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "4px 10px",
        color: "var(--text)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
