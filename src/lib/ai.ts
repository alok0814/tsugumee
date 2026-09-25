import { VIEWPOINTS } from "../data/program.ts";
import type { Company, Feedback } from "../types.ts";
import { clip } from "./format.ts";

export const EXAMPLE_REPORT =
  "見積の横で、社長が「この屋根、いつもの感覚で38万」と言った。前回の浜寺の現場と比べたメモはなかった。田中さんは「その数字、朝礼に書け」と言った。";

export const SAMPLE_SPOKEN =
  "うちは堺で40年、戸建てとリフォームや。大事なんは、安い家を量産することやなくて、施主が10年後に、あの時の判断でよかったと言うことや。困ってるんは、見積の感覚が俺の頭にしかないことと、棟梁の田中が休むと現場の順番が崩れること。リフォームの電話も全部俺の携帯に来る。継ぐ人には、職人と黙って飯が食えて、数字も嫌がらん人であってほしい。";

const FALLBACK: Feedback = {
  insight:
    "日報から具体的な一言を取り出せなかった。木下工務店では、見積の感覚とリフォームの電話が社長一人に残っている。",
  proposalDraft: "次の現場で、社長が口にした数字を1つだけ聞き取り、メモに残す。",
  karteHint:
    "更新候補を作れなかった。次の日報では、その日に聞いた数字か人の名前を一文入れる。",
};

export function extractQuote(body: string): string {
  const chunks = body
    .split(/[。！？\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);
  if (chunks.length === 0) return "";
  const ranked = [...chunks].sort((a, b) => scoreChunk(b) - scoreChunk(a));
  const best = ranked[0].replaceAll("「", "").replaceAll("」", "");
  return clip(best, 42);
}

function scoreChunk(text: string): number {
  let score = Math.min(text.length, 40);
  if (/\d/.test(text)) score += 30;
  if (/社長|棟梁|田中|見積|電話|職人|万/.test(text)) score += 12;
  return score;
}

export function generateReportFeedback(body: string, company: Company): Feedback {
  try {
    const quote = extractQuote(body);
    if (!quote) return FALLBACK;
    const issue = company.siteIssues.split("。")[0];
    if (/見積|単価|感覚|万/.test(body)) {
      return {
        insight: `「${quote}」と書いている。見積の感覚が${company.presidentName}の頭の中に残ったまま、というこの店の課題がその日の言葉に出ている。`,
        proposalDraft: `次の見積1件で、社長が口にした単価の根拠をその場で1行残す。きっかけは「${quote}」。`,
        karteHint: `社長しか知らない仕事に足す候補: 「${quote}」`,
      };
    }
    if (/電話|問い合わせ|携帯/.test(body)) {
      return {
        insight: `「${quote}」と書いている。リフォームの受けが${company.presidentName}の携帯で止まっている、という記録だ。`,
        proposalDraft: `「${quote}」を起点に、その日の問い合わせを1件だけ、社長以外が一次記録に残す。`,
        karteHint: `現場の課題に足す候補: 「${quote}」`,
      };
    }
    if (/ロス|資材/.test(body)) {
      return {
        insight: `「${quote}」と書いている。資材の数字が口頭のまま流れていた場所を、一文で押さえている。`,
        proposalDraft: `「${quote}」について、週に1回だけ枚数か金額を1枚の紙に残す。`,
        karteHint: `現場の課題に足す候補: 「${quote}」`,
      };
    }
    if (/棟梁|田中|職人/.test(body)) {
      return {
        insight: `「${quote}」と書いている。職人の言葉が日報に残ると、社長一人の評価では見えない現場の受け取りが残る。`,
        proposalDraft: `「${quote}」を、翌朝の朝礼で確認する項目として1つだけホワイトボードに書く。`,
        karteHint: `現場の更新候補: 「${quote}」`,
      };
    }
    return {
      insight: `「${quote}」と書いている。${issue}という課題のそばで起きたことだ。`,
      proposalDraft: `「${quote}」について、明日の朝礼で職人に確認することを1つだけホワイトボードに残す。`,
      karteHint: `現場の課題の更新候補: 「${quote}」`,
    };
  } catch {
    return FALLBACK;
  }
}

export function viewpointTitleFor(body: string): (typeof VIEWPOINTS)[number] {
  if (/継ぐ|任される|粗利|覚悟|手元/.test(body)) return "この会社を継ぐ覚悟が見えるか";
  if (/見積|単価|感覚|電話|問い合わせ|携帯/.test(body)) return "提案が現場の実情に合っているか";
  if (/職人|棟梁|田中/.test(body)) return "職人・従業員からどう見られているか";
  if (/掃除|運び|片付け|単純/.test(body)) return "現場になじんでいるか";
  return "手を抜かず続けているか";
}

export type OrganizedKarte = Pick<
  Company,
  | "presidentQuote"
  | "values"
  | "siteIssues"
  | "customerTraits"
  | "presidentOnlyWork"
  | "successorNeeds"
  | "siteLines"
>;

export function organizeSpoken(text: string, current: Company): OrganizedKarte {
  const spoken = text.trim();
  if (spoken.length < 8) {
    throw new Error("too short");
  }
  if (/頭/.test(spoken) && /田中/.test(spoken) && /携帯/.test(spoken)) {
    return {
      presidentQuote: "職人と黙って飯が食えて、数字も嫌がらない人に継いでほしい。",
      values:
        "安い家を量産しない。施主が10年後に「あの時の判断でよかった」と言える仕事を残す。",
      siteIssues:
        "見積の感覚が社長の頭にしかない。棟梁の田中が休むと現場の順番が崩れる。リフォームの電話は全部社長の携帯に来る。",
      customerTraits: current.customerTraits,
      presidentOnlyWork:
        "見積の感覚と、リフォームの電話。社長は「俺の頭」「俺の携帯」と言っている。",
      successorNeeds: "職人と黙って飯が食えて、数字を嫌がらない人。",
      siteLines: [
        "見積の感覚は、社長の頭の中にしかない",
        "リフォームの電話は、全部社長の携帯に入る",
        "棟梁の田中が休むと、現場の順番が崩れる",
      ],
    };
  }
  const parts = spoken
    .split(/[。\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);
  const quote = extractQuote(spoken) || clip(spoken, 42);
  const values = parts.find((part) => /大事|残|飯|継/.test(part)) ?? parts[0] ?? quote;
  const issues = parts.filter((part) => /困|ない|崩|頭|携帯|休/.test(part));
  const only = parts.find((part) => /俺|頭|携帯|見積/.test(part)) ?? quote;
  const needs = parts.find((part) => /継|ほしい|欲しい|人/.test(part)) ?? current.successorNeeds;
  const lines = parts.map((part) => clip(part.replaceAll("「", "").replaceAll("」", ""), 42));
  return {
    presidentQuote: quote,
    values: clip(values, 80),
    siteIssues: clip(issues.join("。") || quote, 120),
    customerTraits: current.customerTraits,
    presidentOnlyWork: clip(only, 80),
    successorNeeds: clip(needs, 80),
    siteLines: [
      lines[0] ?? current.siteLines[0],
      lines[1] ?? current.siteLines[1],
      lines[2] ?? current.siteLines[2],
    ],
  };
}
