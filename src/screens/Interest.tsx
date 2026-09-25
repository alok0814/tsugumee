import { useState } from "react";
import { COMPANY_ID } from "../data/program.ts";
import { useStore } from "../state.tsx";
import type { Interest as InterestItem } from "../types.ts";

export function Interest() {
  const { data, sendOffer } = useStore();
  const company = data.companies.find((item) => item.id === COMPANY_ID) ?? data.companies[0];
  const mine = data.interests.filter((item) => item.companyId === company.id);
  const likes = mine.filter((item) => item.kind === "気になる");
  const intents = mine.filter((item) => item.kind === "応募意向");
  const [openId, setOpenId] = useState<string | null>(null);
  const person = mine.find((item) => item.id === openId);

  if (person) {
    return (
      <Person person={person} onBack={() => setOpenId(null)} onOffer={() => sendOffer(person.id)} />
    );
  }

  return (
    <div className="wide stack">
      <h1>{company.name}</h1>
      <div className="stats">
        <section className="block">
          <h2>気になっている</h2>
          <p className="figure">{likes.length}人</p>
        </section>
        <section className="block">
          <h2>応募の意向</h2>
          <p className="figure">{intents.length}人</p>
        </section>
        <section className="block">
          <h2>カルテを見た</h2>
          <p className="figure">{company.views}</p>
        </section>
      </div>
      <section className="block">
        <h2>オファー</h2>
        <p className="quiet">気になる、または応募の意向がある人に、社長から声をかけられます。</p>
        <ul className="people">
          {mine.map((item) => (
            <li key={item.id}>
              <button type="button" className="person-open" onClick={() => setOpenId(item.id)}>
                <img src={item.photo} alt="" />
                <span>
                  <strong>{item.name}</strong>
                  <span className="quiet">
                    {item.affiliation} · {item.livesIn} · {item.kind}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="primary"
                disabled={item.offered}
                onClick={() => sendOffer(item.id)}
              >
                {item.offered ? "オファー済み" : "オファーする"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Person({
  person,
  onBack,
  onOffer,
}: {
  person: InterestItem;
  onBack: () => void;
  onOffer: () => void;
}) {
  return (
    <div className="wide stack">
      <button type="button" className="back" onClick={onBack}>
        ← 一覧
      </button>
      <article className="profile">
        <header className="profile-head">
          <img src={person.photo} alt="" />
          <div>
            <h1>{person.name}</h1>
            <p>{person.affiliation}</p>
            <p className="quiet">
              {person.livesIn} · {person.kind}
            </p>
          </div>
        </header>
        <section>
          <h2>学校でやっていること</h2>
          <p>{person.studies}</p>
        </section>
        <section>
          <h2>意気込み</h2>
          <p>{person.drive}</p>
        </section>
        <section>
          <h2>生き方</h2>
          <p>{person.futureImage}</p>
        </section>
        <button type="button" className="primary" disabled={person.offered} onClick={onOffer}>
          {person.offered ? "オファー済み" : "オファーする"}
        </button>
      </article>
    </div>
  );
}
