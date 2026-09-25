import { useRef, useState, type FormEvent } from "react";
import { COMPANY_ID, STAGES, HERO_PLACEMENT_ID } from "../data/program.ts";
import { EXAMPLE_REPORT } from "../lib/ai.ts";
import { formatDate, formatManYen } from "../lib/format.ts";
import { placementOf } from "../lib/select.ts";
import { useStore } from "../state.tsx";
import type { Feedback } from "../types.ts";
import { AskingPrice, Reaction, StageTrack } from "../ui.tsx";

export function Karte({ companyId, onBack }: { companyId: string; onBack: () => void }) {
  const { data, markIntent, toggleInterest } = useStore();
  const company = data.companies.find((item) => item.id === companyId);
  const placement = placementOf(data, HERO_PLACEMENT_ID);
  const current = companyId === COMPANY_ID ? placement?.stage : undefined;
  const mine = data.interests.find((item) => item.mine && item.companyId === companyId);

  if (!company) {
    return (
      <div className="narrow">
        <h1>企業が見つかりません。</h1>
      </div>
    );
  }

  return (
    <div className="narrow stack">
      <button type="button" className="secondary" onClick={onBack}>
        一覧へ
      </button>
      <p className="quiet">
        {company.region} · {company.industry} · {company.presidentName}
      </p>
      <h1>{company.name}</h1>
      <img className="karte-photo" src={company.photo} alt="" />
      <AskingPrice company={company} />

      <section className="block">
        <h2>継がせてもいい人</h2>
        <p>{company.successorCondition}</p>
        <p className="by">「{company.presidentQuote}」</p>
      </section>

      <section className="block">
        <h2>大事にしていること</h2>
        <p>{company.values}</p>
      </section>

      <section className="block">
        <h2>現場の課題</h2>
        <p>{company.siteIssues}</p>
      </section>

      <section className="block">
        <h2>数字</h2>
        <table className="duty">
          <thead>
            <tr>
              <th>年</th>
              <th>年商</th>
              <th>営業利益</th>
            </tr>
          </thead>
          <tbody>
            {company.years.map((year) => (
              <tr key={year.label}>
                <td>{year.label}</td>
                <td>{formatManYen(year.revenue)}</td>
                <td>{formatManYen(year.operatingProfit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="meta">
          従業員 {company.employees}名 · 主要取引先 {company.clientCount}社 · 借入{" "}
          {company.hasDebt ? "あり" : "なし"}
        </p>
      </section>

      <section className="block">
        <h2>修行で任されること</h2>
        <table className="duty">
          <thead>
            <tr>
              <th>段階</th>
              <th>期間</th>
              <th>任されること</th>
              <th>報酬</th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((stage) => (
              <tr key={stage.id} className={current === stage.id ? "is-now" : undefined}>
                <td>
                  {stage.id} {stage.name}
                  {current === stage.id ? <em className="here">いまここ</em> : null}
                </td>
                <td>{stage.period}</td>
                <td>{stage.duty}</td>
                <td>{stage.pay}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="meta">
          段階3は時給に、担当部門の粗利の5%が足される。
          {company.id === COMPANY_ID
            ? "木下工務店のリフォーム粗利は月80万円前後なので、5%は月4万円前後。"
            : ""}
        </p>
      </section>

      <div className="cta">
        <p>{mine?.kind === "応募意向" ? "応募の意向を伝えています。" : "まだ修行には入っていません。"}</p>
        <div className="row">
          <button
            type="button"
            className={mine ? "star is-on" : "star"}
            disabled={mine?.kind === "応募意向"}
            onClick={() => toggleInterest(company.id)}
          >
            {mine ? "★ 気になる済" : "☆ 気になる"}
          </button>
          <button
            type="button"
            className="primary"
            disabled={mine?.kind === "応募意向"}
            onClick={() => markIntent(company.id)}
          >
            {mine?.kind === "応募意向" ? "意向済み" : "応募する"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, addReport, publishProposal } = useStore();
  const placement = placementOf(data, HERO_PLACEMENT_ID);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [last, setLast] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const sending = useRef(false);
  const publishing = useRef(false);

  if (!placement || placement.stage === "ended") {
    return (
      <div className="narrow">
        <h1>修行は終了しています。</h1>
      </div>
    );
  }

  const stage = STAGES.find((item) => item.id === placement.stage);
  const proposals = data.proposals
    .filter((item) => item.placementId === placement.id)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || b.index - a.index)
    .map(({ item }) => item);
  const reports = data.reports
    .filter((item) => item.placementId === placement.id)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || b.index - a.index)
    .map(({ item }) => item);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    const text = draft.trim();
    if (!text) {
      setError("日報を書いてから送ってください。");
      return;
    }
    sending.current = true;
    setError(null);
    setPhase("loading");
    await new Promise((resolve) => setTimeout(resolve, 680));
    const result = addReport(text);
    sending.current = false;
    if ("error" in result) {
      setPhase("idle");
      setError(result.error);
      return;
    }
    setLast(result);
    setPublished(false);
    publishing.current = false;
    setDraft("");
    setPhase("done");
  }

  function onPublish() {
    if (!last || published || publishing.current) return;
    publishing.current = true;
    setPublished(true);
    publishProposal(last.proposalDraft);
  }

  return (
    <div className="narrow stack">
      <h1>
        段階{placement.stage} {stage?.name}
      </h1>
      <StageTrack stage={placement.stage} />
      <p className="gate-line">
        次の見極めゲートは <strong>{placement.gateDate ? formatDate(placement.gateDate) : "未定"}</strong>
        。任されるのは、{stage?.duty}。報酬は{stage?.pay}。
      </p>

      <section className="block">
        <h2>今月のミッション</h2>
        <ol className="missions">
          {placement.missions.map((mission) => (
            <li key={mission}>{mission}</li>
          ))}
        </ol>
      </section>

      <section className="block">
        <h2>日報を書く</h2>
        <form onSubmit={onSubmit} className="stack-sm">
          <label htmlFor="report">今日の現場</label>
          <textarea
            id="report"
            rows={5}
            value={draft}
            placeholder="今日の現場で起きたことを、そのまま書く"
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="row">
            <button type="submit" className="primary" disabled={phase === "loading"}>
              {phase === "loading" ? "日報の言葉を拾っています" : "日報を送る"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setDraft(EXAMPLE_REPORT)}
            >
              例文を入れる
            </button>
          </div>
          {error ? <p className="alert">{error}</p> : null}
        </form>
        {phase === "done" && last ? (
          <div className="feedback rise" aria-live="polite">
            <div>
              <p className="kicker">気づき</p>
              <p>{last.insight}</p>
            </div>
            <div>
              <p className="kicker">社長に出せる改善提案の下書き</p>
              <p>{last.proposalDraft}</p>
            </div>
            <div>
              <p className="kicker">カルテ更新候補</p>
              <p>{last.karteHint}</p>
            </div>
            <button type="button" className="primary" onClick={onPublish} disabled={published}>
              {published ? "提案として出しました" : "この下書きを提案として出す"}
            </button>
            <p className="quiet">下書きです。出すかどうかは自分で決めます。</p>
          </div>
        ) : null}
      </section>

      <section className="block">
        <h2>日報と気づき</h2>
        <ul className="timeline">
          {reports.map((report) => (
            <li key={report.id}>
              <p className="kicker">{formatDate(report.date)}</p>
              <p>{report.body}</p>
              {report.insight ? (
                <p className="insight">
                  <span>気づき</span>
                  {report.insight}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="block">
        <h2>出した提案</h2>
        <ul className="proposals">
          {proposals.map((proposal) => (
            <li key={proposal.id}>
              <div>
                <p className="kicker">{formatDate(proposal.date)}</p>
                <p>{proposal.content}</p>
              </div>
              <Reaction value={proposal.reaction} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
