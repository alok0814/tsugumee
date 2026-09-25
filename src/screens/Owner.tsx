import { useState, type ChangeEvent } from "react";
import { DEMO_TODAY } from "../data/program.ts";
import { SAMPLE_SPOKEN } from "../lib/ai.ts";
import { formatDate } from "../lib/format.ts";
import { dayLabel, placementOf, reportsFor, stageLabel, traineeOf } from "../lib/select.ts";
import { useStore } from "../state.tsx";
import type { GateDecision, Stage } from "../types.ts";
import { Reaction, StageTrack } from "../ui.tsx";

const COLUMNS: { id: Stage; label: string; sub: string }[] = [
  { id: 1, label: "段階1", sub: "従業員" },
  { id: 2, label: "段階2", sub: "社長の右腕" },
  { id: 3, label: "段階3", sub: "経営参画" },
  { id: "ended", label: "終了", sub: "見送り・辞退・承継" },
];

export function Board({ onOpen }: { onOpen: (placementId: string) => void }) {
  const { data } = useStore();

  return (
    <div className="wide stack">
      <div>
        <h1>修行中</h1>
        <p className="quiet">名前を開くと、日報と継続判定が見られます。</p>
      </div>
      <div className="kanban">
        {COLUMNS.map((column) => {
          const cards = data.placements.filter((item) => item.stage === column.id);
          return (
            <section key={column.label} className="column">
              <header>
                <h2>{column.label}</h2>
                <p>{column.sub}</p>
              </header>
              {cards.length === 0 ? <p className="empty">まだ誰もいない</p> : null}
              {cards.map((placement) => {
                const trainee = traineeOf(data, placement.traineeId);
                if (!trainee) return null;
                const where =
                  placement.stage === "ended"
                    ? `終了${placement.endReason ? ` · ${placement.endReason}` : ""}`
                    : `段階${placement.stage} · ${stageLabel(placement.stage)}`;
                return (
                  <button
                    key={placement.id}
                    type="button"
                    className="person-card"
                    onClick={() => onOpen(placement.id)}
                  >
                    <strong>{trainee.name}</strong>
                    <span>
                      {trainee.university} {trainee.grade}
                    </span>
                    <span>{where}</span>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function Review({ placementId }: { placementId: string }) {
  const { data, setReaction, decideGate, addPresidentReport, updateReport } = useStore();
  const placement = placementOf(data, placementId);
  const trainee = placement ? traineeOf(data, placement.traineeId) : undefined;
  const [agreement, setAgreement] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!placement || !trainee) {
    return (
      <div className="narrow">
        <h1>候補者が見つかりません。</h1>
      </div>
    );
  }

  const reports = reportsFor(data, placement.id)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || b.index - a.index)
    .map(({ item }) => item);
  const proposals = data.proposals.filter((item) => item.placementId === placement.id);
  const gates = data.gates.filter((item) => item.placementId === placement.id);
  const staff = data.staffReviews.filter((item) => item.placementId === placement.id);
  const review = data.aiReviews.find((item) => item.traineeId === trainee.id);
  const rankTone =
    review && (review.rank === "S" || review.rank === "A")
      ? "is-high"
      : review && (review.rank === "D" || review.rank === "E" || review.rank === "F")
        ? "is-low"
        : "";

  function onDecide(decision: GateDecision) {
    const error = decideGate(placementId, decision, agreement, comment);
    setMessage(error ?? `${decision} を記録しました。`);
    if (!error) setComment("");
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setShot(URL.createObjectURL(file));
    setDraft("");
  }

  const onRead = () => {
    const text: Record<string, string> = {
      aoi: "葵は今日、見積の横で単価の根拠を自分から聞いていた。田中も昼は一緒に食っている。電話の受け皿は、まだ俺が持ったままだ。",
      ren: "蓮は今日も掃き掃除と端材だった。自分から段取りは聞いてこない。昼は一人で食っていた。",
      daiki: "大輝は現場に来なかった。設計の話だけ残して、昼前に帰った。",
    };
    setDraft(text[trainee.id] ?? `${trainee.name}の今日の様子を、手書きから読み取った。`);
  };

  const onSaveNote = () => {
    addPresidentReport(placement.id, draft);
    setDraft("");
    setShot(null);
  };

  return (
    <div className="wide stack">
      <div className="review-head">
        <div>
          <h1>{trainee.name}</h1>
          <p>
            {trainee.university} {trainee.grade} · {trainee.hometown}出身 · {dayLabel(placement)}
          </p>
          <dl className="facts">
            <div>
              <dt>適性</dt>
              <dd>{trainee.aptitude}</dd>
            </div>
            <div>
              <dt>志望</dt>
              <dd>{trainee.motivation}</dd>
            </div>
            <div>
              <dt>やりたい経営</dt>
              <dd>{trainee.desiredManagement}</dd>
            </div>
          </dl>
        </div>
        <div>
          {placement.stage === "ended" ? (
            <p className="ended-banner">
              終了 · {placement.endReason}
              <span>{placement.endComment}</span>
            </p>
          ) : (
            <p className="gate-line">
              段階{placement.stage} {stageLabel(placement.stage)}
            </p>
          )}
          {placement.stage !== "ended" ? <StageTrack stage={placement.stage} /> : null}
        </div>
      </div>

      <div className="review">
        <section className="block">
          <h2>日報</h2>
          <p className="quiet">手書きの写真を置くと、文字を読み取ります。直してから記録できます。</p>
          <label className="file-pick">
            手書きの写真を選ぶ
            <input type="file" accept="image/*" onChange={onPick} />
          </label>
          {shot ? <img className="shot" src={shot} alt="読み取る手書き" /> : null}
          {shot ? (
            <button type="button" className="secondary" onClick={onRead}>
              文字起こしする
            </button>
          ) : null}
          {draft ? (
            <div className="stack-sm">
              <label htmlFor="transcript">読み取った文</label>
              <textarea
                id="transcript"
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button type="button" className="primary" onClick={onSaveNote}>
                記録する
              </button>
            </div>
          ) : null}
          <ol className="timeline">
            {reports.map((report) => (
              <li key={report.id}>
                <div className="note-head">
                  <p className="kicker">
                    {report.by === "president" ? "社長の日報" : "日報"} · {formatDate(report.date)}
                    {report.date === DEMO_TODAY ? <span className="tag">今日</span> : null}
                  </p>
                  {editingId === report.id ? null : (
                    <button
                      type="button"
                      className="mini"
                      onClick={() => {
                        setEditingId(report.id);
                        setEditText(report.body);
                      }}
                    >
                      編集
                    </button>
                  )}
                </div>
                {editingId === report.id ? (
                  <div className="stack-sm">
                    <textarea rows={4} value={editText} onChange={(event) => setEditText(event.target.value)} />
                    <div className="row">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          updateReport(report.id, editText);
                          setEditingId(null);
                        }}
                      >
                        保存
                      </button>
                      <button type="button" className="secondary" onClick={() => setEditingId(null)}>
                        やめる
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{report.body}</p>
                )}
              </li>
            ))}
          </ol>
          {proposals.length > 0 ? (
            <>
              <h2>提案</h2>
              <ol className="timeline">
                {proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <p className="kicker">提案 · {formatDate(proposal.date)}</p>
                    <p>{proposal.content}</p>
                    <div className="row">
                      <Reaction value={proposal.reaction} />
                      <button
                        type="button"
                        className={proposal.reaction === "採用" ? "mini is-on" : "mini"}
                        onClick={() => setReaction(proposal.id, "採用")}
                      >
                        採用
                      </button>
                      <button
                        type="button"
                        className={proposal.reaction === "保留" ? "mini is-on" : "mini"}
                        onClick={() => setReaction(proposal.id, "保留")}
                      >
                        保留
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {gates.length > 0 ? (
            <>
              <h2>継続判定の記録</h2>
              <ol className="timeline">
                {gates.map((gate) => (
                  <li key={gate.id}>
                    <p className="kicker">
                      継続判定 · 段階{gate.stage} · {formatDate(gate.date)}
                    </p>
                    <p>
                      {gate.decision}。{gate.comment}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </section>

        <div className="review-side">
          {placement.stage === "ended" ? null : (
            <section className="gatebar">
              <div>
                <h2>継続判定</h2>
                {placement.stage === 1 ? (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={agreement}
                      onChange={(event) => setAgreement(event.target.checked)}
                    />
                    承継を前提とした合意を交わした
                  </label>
                ) : placement.hasAgreement ? (
                  <p className="quiet">段階2に進むとき、承継を前提とした合意は済んでいます。</p>
                ) : null}
                <label htmlFor="gate-comment">コメント</label>
                <input
                  id="gate-comment"
                  value={comment}
                  placeholder="なぜ進めるか、止めるか"
                  onChange={(event) => setComment(event.target.value)}
                />
                {message ? (
                  <p className={message.includes("必要") || message.includes("終了") ? "alert" : "done-note"}>
                    {message}
                  </p>
                ) : null}
              </div>
              <div className="decide">
                <button type="button" className="decide-go" onClick={() => onDecide("次の段階へ")}>
                  次の段階へ
                </button>
                <button type="button" className="decide-hold" onClick={() => onDecide("もう1ヶ月")}>
                  もう1ヶ月
                </button>
                <button type="button" className="decide-stop" onClick={() => onDecide("ここまで")}>
                  ここまで
                </button>
              </div>
            </section>
          )}
          <section className="block">
            <h2>社員からの評価</h2>
            <p className="quiet">現場にいる社員だけが答える。他の候補者には見えません。</p>
            <div className="qr-row">
              <svg className="qr" viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" fill="#fff" />
                <path fill="#1a1a1a" d="M4 4h20v20H4zM8 8v12h12V8zM40 4h20v20H40zM44 8v12h12V8zM4 40h20v20H4zM8 44v12h12V44z" />
                <rect x="28" y="8" width="6" height="6" fill="#1a1a1a" />
                <rect x="28" y="28" width="8" height="8" fill="#1a1a1a" />
                <rect x="44" y="28" width="6" height="6" fill="#1a1a1a" />
                <rect x="52" y="40" width="8" height="8" fill="#1a1a1a" />
                <rect x="36" y="48" width="10" height="6" fill="#1a1a1a" />
              </svg>
              <p>社員に配るQR。回答はこの画面にだけ届きます。</p>
            </div>
            {staff.length === 0 ? <p className="empty">まだ届いていません。</p> : null}
            <ul className="hints">
              {staff.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.staffName} · {item.role} · {formatDate(item.date)}
                  </span>
                  {item.body}
                </li>
              ))}
            </ul>
          </section>
          {review ? (
            <section className="block">
              <h2>AIの見極め</h2>
              <p className="quiet">社長の言葉、社員の評価、本人のやる気から、今のランクを出しています。</p>
              <p className={`rank ${rankTone}`}>{review.rank}</p>
              <h3>根拠</h3>
              <ul className="grounds">
                <li>
                  <strong>社長</strong>
                  <p>{review.president}</p>
                </li>
                <li>
                  <strong>社員</strong>
                  <p>{review.staff}</p>
                </li>
                <li>
                  <strong>本人</strong>
                  <p>{review.self}</p>
                </li>
              </ul>
              <h3>コミュニケーションの提案</h3>
              <p>{review.communication}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function OwnerKarte() {
  const { data, organize } = useStore();
  const company = data.companies.find((item) => item.id === "kinoshita") ?? data.companies[0];
  const [spoken, setSpoken] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onOrganize() {
    const result = organize(spoken);
    if (result) {
      setError(result);
      setNote(null);
      return;
    }
    setError(null);
    setNote("整理しました。企業を探す画面の現場3行も、この内容に更新しています。");
  }

  const fields = [
    ["社長の言葉", company.presidentQuote],
    ["大事にしていること", company.values],
    ["現場の課題", company.siteIssues],
    ["顧客の特徴", company.customerTraits],
    ["社長しか知らない仕事", company.presidentOnlyWork],
    ["継ぐ人に求めること", company.successorNeeds],
  ] as const;

  return (
    <div className="wide stack">
      <div>
        <h1>{company.name}</h1>
        <p className="quiet">
          日報は全{data.reports.length}件。増えるほど、承継リスクと3年ロードマップに足されます。
        </p>
      </div>

      <div className="o3">
        <div className="stack">
          <section className="block">
            <h2>話し言葉で書く</h2>
            <label htmlFor="spoken">社長の話</label>
            <textarea
              id="spoken"
              rows={6}
              value={spoken}
              placeholder="現場の困りごとを、話し言葉のまま書く"
              onChange={(event) => setSpoken(event.target.value)}
            />
            <div className="row">
              <button type="button" className="primary" onClick={onOrganize}>
                カルテに整理する
              </button>
              <button type="button" className="secondary" onClick={() => setSpoken(SAMPLE_SPOKEN)}>
                話し言葉の例を入れる
              </button>
            </div>
            {error ? <p className="alert">{error}</p> : null}
            {note ? <p className="done-note">{note}</p> : null}
          </section>

          <section className="block">
            <h2>整理されたカルテ</h2>
            <dl className="karte">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="kicker">企業を探す画面に出る現場3行</p>
            <ol className="lines">
              {company.siteLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </section>

          {data.karteHints.length > 0 ? (
            <section className="block">
              <h2>日報から拾った更新候補</h2>
              <ul className="hints">
                {data.karteHints.map((hint, index) => (
                  <li key={`${hint.date}-${index}`}>
                    <span>{formatDate(hint.date)}</span>
                    {hint.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="stack">
          {data.freshNotes.length > 0 ? (
            <p className="banner">日報が増えたので、承継リスクを更新しました。</p>
          ) : null}
          <section className="stack-sm">
            <h2>承継リスク</h2>
            {data.risks.map((risk, index) => (
              <article key={risk.title} className="risk">
                <p className="kicker">0{index + 1}</p>
                <h3>{risk.title}</h3>
                <p>{risk.body}</p>
                {index === 0
                  ? data.freshNotes.map((item, noteIndex) => (
                      <p key={`${noteIndex}-${item}`} className="fresh">
                        {item}
                      </p>
                    ))
                  : null}
              </article>
            ))}
          </section>
          <section className="stack-sm">
            <h2>3年ロードマップ</h2>
            {data.roadmap.map((year) => (
              <article key={year.year} className="year">
                <p className="kicker">{year.year}</p>
                <h3>{year.title}</h3>
                <p>{year.body}</p>
                {year.year === "1年目" && data.freshNotes.length > 0 ? (
                  <p className="fresh">
                    日報が追加されています。1年目は、その具体的な一文を手順の見出しに足せます。
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
