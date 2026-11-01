"use client";

import { useState } from "react";
import { fieldClass, labelClass } from "./styles";

export function CountedField({
  name,
  label,
  defaultValue = "",
  recommended,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  recommended: number;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const over = value.length > recommended;
  const counter = (
    <span className={over ? "text-xs text-amber-300" : "text-xs text-white/40"}>
      {value.length}/{recommended}
    </span>
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className={`${labelClass} mb-0`} htmlFor={name}>
          {label}
        </label>
        {counter}
      </div>
      {rows > 1 ? (
        <textarea id={name} name={name} rows={rows} value={value} onChange={(event) => setValue(event.target.value)} className={fieldClass} />
      ) : (
        <input id={name} name={name} value={value} onChange={(event) => setValue(event.target.value)} className={fieldClass} />
      )}
    </div>
  );
}
