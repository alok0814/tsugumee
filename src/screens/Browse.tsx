import { useMemo, useState } from "react";
import { formatManYen, formatSlash } from "../lib/format.ts";
import { useStore } from "../state.tsx";
import type { Company } from "../types.ts";
import { AskingPrice } from "../ui.tsx";

const ANY = "指定なし";
const FEATURED = ["kinoshita", "bento", "nouen"];

const PRICE_STEPS = [
  [ANY, ANY],
  ["3000000", "300万円"],
  ["5000000", "500万円"],
  ["10000000", "1,000万円"],
  ["15000000", "1,500万円"],
  ["20000000", "2,000万円"],
] as const;

const REVENUE_STEPS = [
  [ANY, ANY],
  ["30000000", "3,000万円"],
  ["50000000", "5,000万円"],
  ["80000000", "8,000万円"],
  ["100000000", "1億円"],
] as const;

const PROFIT_STEPS = [
  [ANY, ANY],
  ["1000000", "100万円"],
  ["2000000", "200万円"],
  ["4000000", "400万円"],
] as const;

type SortKey = "none" | "price-asc" | "price-desc" | "revenue" | "new";

function bound(value: string): number | null {
  return value === ANY ? null : Number(value);
}

export function Browse({ onOpen }: { onOpen: (companyId: string) => void }) {
  const { data, toggleInterest } = useStore();
  const [region, setRegion] = useState(ANY);
  const [industry, setIndustry] = useState(ANY);
  const [priceMin, setPriceMin] = useState(ANY);
  const [priceMax, setPriceMax] = useState(ANY);
  const [revenueMin, setRevenueMin] = useState(ANY);
  const [profitMin, setProfitMin] = useState(ANY);
  const [hideDebt, setHideDebt] = useState(false);
  const [sort, setSort] = useState<SortKey>("none");
  const [showFeatured, setShowFeatured] = useState(true);

  const regions = useMemo(
    () => [ANY, ...new Set(data.companies.map((company) => company.region))],
    [data.companies],
  );
  const industries = useMemo(
    () => [ANY, ...new Set(data.companies.map((company) => company.industry))],
    [data.companies],
  );

  const list = useMemo(() => {
    const minPrice = bound(priceMin);
    const maxPrice = bound(priceMax);
    const minRevenue = bound(revenueMin);
    const minProfit = bound(profitMin);
    const next = data.companies.filter((company) => {
      if (region !== ANY && company.region !== region) return false;
      if (industry !== ANY && company.industry !== industry) return false;
      if (minPrice !== null && company.askingPrice < minPrice) return false;
      if (maxPrice !== null && company.askingPrice > maxPrice) return false;
      if (minRevenue !== null && company.revenue < minRevenue) return false;
      if (minProfit !== null && company.operatingProfit < minProfit) return false;
      if (hideDebt && company.hasDebt) return false;
      return true;
    });
    const sorted = [...next];
    if (sort === "price-asc") sorted.sort((a, b) => a.askingPrice - b.askingPrice);
    if (sort === "price-desc") sorted.sort((a, b) => b.askingPrice - a.askingPrice);
    if (sort === "revenue") sorted.sort((a, b) => b.revenue - a.revenue);
    if (sort === "new") sorted.sort((a, b) => b.updated.localeCompare(a.updated));
    return sorted;
  }, [data.companies, region, industry, priceMin, priceMax, revenueMin, profitMin, hideDebt, sort]);

  const featured = FEATURED.map((id) => list.find((company) => company.id === id)).filter(
    (company): company is Company => Boolean(company),
  );

  function liked(companyId: string) {
    return data.interests.some((item) => item.mine && item.companyId === companyId);
  }

  return (
    <div className="market">
      <aside className="side">
        <h2>詳しい条件</h2>
        <label>
          業種
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            {industries.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          地域
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>譲渡希望額</legend>
          <label>
            下限
            <select value={priceMin} onChange={(event) => setPriceMin(event.target.value)}>
              {PRICE_STEPS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            上限
            <select value={priceMax} onChange={(event) => setPriceMax(event.target.value)}>
              {PRICE_STEPS.map(([value, label]) => (
                <option key={`max-${value}`} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <label>
          売上高の下限
          <select value={revenueMin} onChange={(event) => setRevenueMin(event.target.value)}>
            {REVENUE_STEPS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          営業利益の下限
          <select value={profitMin} onChange={(event) => setProfitMin(event.target.value)}>
            {PROFIT_STEPS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={hideDebt}
            onChange={(event) => setHideDebt(event.target.checked)}
          />
          借入ありを除く
        </label>
      </aside>

      <div className="board-main">
        {showFeatured && featured.length > 0 ? (
          <section className="featured">
            <div className="featured-head">
              <h2>林さんにおすすめの案件</h2>
              <button type="button" className="icon-x" onClick={() => setShowFeatured(false)} aria-label="おすすめを閉じる">
                ×
              </button>
            </div>
            <div className="featured-row">
              {featured.map((company) => (
                <button key={company.id} type="button" className="mini-deal" onClick={() => onOpen(company.id)}>
                  <img src={company.photo} alt="" />
                  <span className="ask-price">{formatManYen(company.askingPrice)}</span>
                  <strong>{company.name}</strong>
                  <span>{company.successorCondition}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="market-bar">
          <p>
            {list.length === 0 ? "0件" : `1–${list.length}件`} / {data.companies.length}件
          </p>
          <label>
            並び順
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="none">指定なし</option>
              <option value="price-asc">譲渡希望額が低い</option>
              <option value="price-desc">譲渡希望額が高い</option>
              <option value="revenue">売上高が高い</option>
              <option value="new">更新が新しい</option>
            </select>
          </label>
        </div>

        {list.length === 0 ? <p className="empty">その条件の企業はありません。</p> : null}
        <div className="deals">
          {list.map((company) => (
            <article key={company.id} className="deal">
              <button type="button" className="deal-photo" aria-label={`${company.name}のカルテ`} onClick={() => onOpen(company.id)}>
                <img src={company.photo} alt="" />
              </button>
              <p className="deal-dates">
                公開 {formatSlash(company.published)}　更新 {formatSlash(company.updated)}
              </p>
              <AskingPrice company={company} />
              <p className="deal-cat">{company.industry}</p>
              <h3>
                <button type="button" className="deal-title" onClick={() => onOpen(company.id)}>
                  {company.name}
                </button>
              </h3>
              <p className="deal-lead">{company.successorCondition}</p>
              <dl className="deal-facts">
                <div>
                  <dt>売上高</dt>
                  <dd>{formatManYen(company.revenue)}</dd>
                </div>
                <div>
                  <dt>営業利益</dt>
                  <dd>{formatManYen(company.operatingProfit)}</dd>
                </div>
                <div>
                  <dt>地域</dt>
                  <dd>{company.region}</dd>
                </div>
                <div>
                  <dt>従業員</dt>
                  <dd>{company.employees}名</dd>
                </div>
              </dl>
              <button
                type="button"
                className={liked(company.id) ? "star is-on" : "star"}
                onClick={() => toggleInterest(company.id)}
              >
                {liked(company.id) ? "★ 気になる済" : "☆ 気になる"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
