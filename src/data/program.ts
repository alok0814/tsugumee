export const DEMO_TODAY = "2026-09-25";

export const HERO_TRAINEE_ID = "aoi";
export const HERO_PLACEMENT_ID = "p-aoi";
export const COMPANY_ID = "kinoshita";
export const BROWSER_NAME = "林 透";
export const BROWSER_AFFILIATION = "大阪府立大学 4年";
export const BROWSER_PROFILE = {
  photo: "/photos/hayashi.jpg",
  livesIn: "堺市北区",
  vision: "地方の小さな会社で、社長しか知らない仕事を文章と数字に残したい。",
  studies: "大阪府立大学で、地域の会社に入る実習を取っている。",
  drive: "継ぐ側として、最初の半年は現場の手元から逃げない。",
  futureImage: "堺に住み、職人と飯を食い、夜は自分の家で休める働き方がしたい。",
};

export const STAGES = [
  {
    id: 1,
    name: "従業員",
    period: "1〜2ヶ月目",
    duty: "現場作業、職人と一緒に動く",
    pay: "時給1,200円",
  },
  {
    id: 2,
    name: "社長の右腕",
    period: "3〜4ヶ月目",
    duty: "見積・営業同行、経営会議に同席、改善提案",
    pay: "時給1,200円",
  },
  {
    id: 3,
    name: "経営参画",
    period: "5〜6ヶ月目",
    duty: "1部門（リフォーム受注）を任される",
    pay: "時給＋担当部門の粗利の5%",
  },
] as const;

export const VIEWPOINTS = [
  "現場になじんでいるか",
  "手を抜かず続けているか",
  "提案が現場の実情に合っているか",
  "職人・従業員からどう見られているか",
  "この会社を継ぐ覚悟が見えるか",
] as const;

export const STAGE2_MISSIONS = [
  "リフォーム見積を2件、社長の隣で作る",
  "資材ロスの数字を経営会議に1枚持っていく",
  "棟梁の段取りを1現場分、自分の言葉で書く",
];

export const STAGE3_MISSIONS = [
  "リフォーム受注を1件、問い合わせから完了まで自分で見る",
  "担当部門の粗利を月次で1枚にまとめる",
  "社長の携帯に入った電話を、その日のうちに一次記録する",
];
