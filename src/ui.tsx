import { useEffect, useRef, useState, type ReactNode } from "react";
import { STAGES } from "./data/program.ts";
import { formatManYen, formatYen } from "./lib/format.ts";
import type { Company, ProposalReaction, Stage } from "./types.ts";

export function StageTrack({ stage }: { stage: Stage }) {
  const rank = stage === "ended" ? 4 : stage;
  return (
    <ol className="track">
      {STAGES.map((item) => {
        const state = item.id < rank ? "is-done" : item.id === rank ? "is-now" : "";
        return (
          <li key={item.id} className={state}>
            <strong>
              {item.id} {item.name}
            </strong>
            <span>{item.period}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function AskingPrice({ company }: { company: Company }) {
  return (
    <div className="ask">
      <p className="ask-label">譲渡希望額</p>
      <p className="ask-price">{formatManYen(company.askingPrice)}</p>
      <p className="ask-note">ローンできる · 月々 {formatYen(company.loanMonthly)}</p>
      <p className="ask-note">または 年商の {company.annualPercent}% を、毎年つぐみへ</p>
    </div>
  );
}

export function Reaction({ value }: { value: ProposalReaction | null }) {
  if (!value) return <span className="state">反応待ち</span>;
  if (value === "採用") return <span className="state is-set">採用</span>;
  return <span className="state">保留</span>;
}

export function Shell({
  tabs,
  current,
  onTab,
  person,
  mode,
  onMode,
  onReset,
  children,
}: {
  tabs: { id: string; label: string }[];
  current: string;
  onTab: (id: string) => void;
  person: string;
  mode: "browse" | "trainee" | "owner";
  onMode: (mode: "browse" | "trainee" | "owner") => void;
  onReset: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="app">
      <header className="bar">
        <div className="bar-left">
          <img className="logo" src="/logo.png" alt="つぎミー" />
          <nav className="nav" aria-label="画面">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tab.id === current ? "nav-item is-on" : "nav-item"}
                aria-current={tab.id === current ? "page" : undefined}
                onClick={() => onTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="account" ref={menuRef}>
          <button
            type="button"
            className="account-name"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((value) => !value)}
          >
            {person}
          </button>
          {open ? (
            <div className="menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onReset();
                }}
              >
                最初の状態に戻す
              </button>
            </div>
          ) : null}
          <div className="modes" aria-label="画面の切り替え">
            {(
              [
                ["browse", "探す"],
                ["trainee", "修行"],
                ["owner", "社長"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={mode === id ? "mode is-on" : "mode"}
                onClick={() => onMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
