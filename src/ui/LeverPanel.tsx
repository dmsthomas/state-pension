import { SPA_PRESETS, customSpaSchedule } from "../model/defaults";
import type { ModelParams, UpratingRule } from "../model/types";

export interface SpaChoice {
  preset: string; // 'legislated' | 'cridland' | 'obr' | 'custom'
  customAge: number;
  customYear: number;
}

interface Props {
  params: ModelParams;
  spaChoice: SpaChoice;
  onChange: (p: ModelParams, s: SpaChoice) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="lever">
      <label className="lever-label">
        <span>{label}</span>
        <span className="val">{display}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.key} className={o.key === value ? "active" : ""} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function LeverPanel({ params, spaChoice, onChange, onReset }: Props) {
  const set = (patch: Partial<ModelParams>) => onChange({ ...params, ...patch }, spaChoice);

  const setSpa = (choice: SpaChoice) => {
    const schedule =
      choice.preset === "custom"
        ? customSpaSchedule(choice.customAge, choice.customYear)
        : SPA_PRESETS[choice.preset].schedule;
    onChange({ ...params, spaSchedule: schedule }, choice);
  };

  const upratingKind = params.uprating.kind;

  return (
    <aside className="levers">
      <h2>Levers</h2>

      <Slider
        label="NI rates"
        value={params.niDeltaPP}
        display={`${params.niDeltaPP >= 0 ? "+" : ""}${params.niDeltaPP.toFixed(1)}pp`}
        min={-2}
        max={6}
        step={0.1}
        onChange={(v) => set({ niDeltaPP: v })}
        hint="Added to the employee (8%), employer (15%) and self-employed (6%) main rates"
      />

      <Slider
        label="Pension level"
        value={params.pensionLevelPct}
        display={`${params.pensionLevelPct}%`}
        min={50}
        max={150}
        step={1}
        onChange={(v) => set({ pensionLevelPct: v })}
        hint="Relative to today's full new State Pension (£241.30/week in 2026-27)"
      />

      <div className="lever">
        <label className="lever-label">
          <span>Pension age</span>
        </label>
        <Seg
          options={[
            { key: "legislated", label: "Legislated" },
            { key: "cridland", label: "Cridland" },
            { key: "obr", label: "OBR" },
            { key: "custom", label: "Custom" },
          ]}
          value={spaChoice.preset}
          onChange={(k) => setSpa({ ...spaChoice, preset: k })}
        />
        <div className="hint">
          {spaChoice.preset === "legislated" && "67 by 2028, 68 by 2046 (current law)"}
          {spaChoice.preset === "cridland" && "67 by 2028, 68 by 2039 (Cridland review)"}
          {spaChoice.preset === "obr" && "68 by 2039, 69 by 2071 (OBR assumption)"}
        </div>
        {spaChoice.preset === "custom" && (
          <>
            <Slider
              label="Rises to"
              value={spaChoice.customAge}
              display={spaChoice.customAge.toFixed(1).replace(".0", "")}
              min={67}
              max={74}
              step={0.5}
              onChange={(v) => setSpa({ ...spaChoice, customAge: v })}
            />
            <Slider
              label="Reached by"
              value={spaChoice.customYear}
              display={String(spaChoice.customYear)}
              min={2032}
              max={2065}
              step={1}
              onChange={(v) => setSpa({ ...spaChoice, customYear: v })}
            />
          </>
        )}
      </div>

      <div className="lever">
        <label className="lever-label">
          <span>Annual uprating</span>
        </label>
        <Seg
          options={[
            { key: "tripleLock", label: "Triple lock" },
            { key: "earnings", label: "Earnings" },
            { key: "cpi", label: "CPI" },
            { key: "fixed", label: "Fixed" },
          ]}
          value={upratingKind}
          onChange={(k) =>
            set({ uprating: (k === "fixed" ? { kind: "fixed", pct: 2 } : { kind: k }) as UpratingRule })
          }
        />
        {params.uprating.kind === "fixed" && (
          <Slider
            label="Fixed rise"
            value={params.uprating.pct}
            display={`${params.uprating.pct.toFixed(1)}%/yr`}
            min={0}
            max={6}
            step={0.1}
            onChange={(v) => set({ uprating: { kind: "fixed", pct: v } })}
          />
        )}
      </div>

      <div className="lever">
        <label className="lever-label">
          <span>Migration</span>
        </label>
        <Seg
          options={[
            { key: "lowMigration", label: "Low" },
            { key: "principal", label: "Principal" },
            { key: "highMigration", label: "High" },
            { key: "zeroMigration", label: "Zero" },
          ]}
          value={params.migration}
          onChange={(k) => set({ migration: k })}
        />
        <div className="hint">ONS 2024-based projection variants (principal: net 230k/yr)</div>
      </div>

      <details className="advanced">
        <summary>Advanced assumptions</summary>
        <Slider
          label="Employment rate (16 to pension age)"
          value={params.employmentRate * 100}
          display={`${Math.round(params.employmentRate * 100)}%`}
          min={60}
          max={90}
          step={1}
          onChange={(v) => set({ employmentRate: v / 100 })}
        />
        <Slider
          label="Triple lock premium over earnings"
          value={params.tripleLockPremiumPP}
          display={`+${params.tripleLockPremiumPP.toFixed(2)}pp/yr`}
          min={0}
          max={1.5}
          step={0.01}
          onChange={(v) => set({ tripleLockPremiumPP: v })}
          hint="OBR central estimate: +0.53pp"
        />
        <Slider
          label="Return on fund balance"
          value={params.fundReturnPct}
          display={`${params.fundReturnPct.toFixed(1)}%`}
          min={0}
          max={6}
          step={0.1}
          onChange={(v) => set({ fundReturnPct: v })}
        />
      </details>

      <button className="reset-btn" onClick={onReset}>
        Reset to current policy
      </button>
    </aside>
  );
}
