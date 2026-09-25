export type Stage = 1 | 2 | 3 | "ended";

export type EndReason = "辞退" | "見送り" | "承継";

export type ProposalReaction = "採用" | "保留";

export type GateDecision = "次の段階へ" | "もう1ヶ月" | "ここまで";

export type Company = {
  id: string;
  name: string;
  region: string;
  industry: string;
  revenue: number;
  operatingProfit: number;
  employees: number;
  clientCount: number;
  hasDebt: boolean;
  presidentName: string;
  presidentQuote: string;
  values: string;
  siteIssues: string;
  customerTraits: string;
  presidentOnlyWork: string;
  successorNeeds: string;
  successorCondition: string;
  siteLines: [string, string, string];
  slots: number;
  years: { label: string; revenue: number; operatingProfit: number }[];
  views: number;
  photo: string;
  published: string;
  updated: string;
  askingPrice: number;
  loanMonthly: number;
  annualPercent: number;
};

export type InterestKind = "気になる" | "応募意向";

export type Interest = {
  id: string;
  companyId: string;
  name: string;
  affiliation: string;
  kind: InterestKind;
  offered: boolean;
  mine: boolean;
  photo: string;
  livesIn: string;
  vision: string;
  studies: string;
  drive: string;
  futureImage: string;
};

export type StaffReview = {
  id: string;
  placementId: string;
  staffName: string;
  role: string;
  body: string;
  date: string;
};

export type Trainee = {
  id: string;
  name: string;
  university: string;
  grade: string;
  hometown: string;
  aptitude: string;
  motivation: string;
  desiredManagement: string;
};

export type Placement = {
  id: string;
  companyId: string;
  traineeId: string;
  stage: Stage;
  startDate: string;
  gateDate: string | null;
  endedOn?: string;
  hasAgreement: boolean;
  endReason?: EndReason;
  endComment?: string;
  missions: string[];
  simpleWorkOnly: boolean;
};

export type Report = {
  id: string;
  placementId: string;
  date: string;
  body: string;
  by?: "president";
  insight?: string;
  proposalDraft?: string;
  karteHint?: string;
};

export type Proposal = {
  id: string;
  placementId: string;
  date: string;
  content: string;
  reaction: ProposalReaction | null;
};

export type GateRecord = {
  id: string;
  placementId: string;
  stage: 1 | 2 | 3;
  decision: GateDecision;
  comment: string;
  date: string;
};

export type Viewpoint = {
  title: string;
  body: string;
};

export type Evaluation = {
  traineeId: string;
  viewpoints: Viewpoint[];
};

export type EvaluationAddendum = {
  traineeId: string;
  title: string;
  text: string;
};

export type KarteHint = {
  date: string;
  text: string;
};

export type Risk = {
  title: string;
  body: string;
};

export type RoadmapYear = {
  year: string;
  title: string;
  body: string;
};

export type AiRank = "S" | "A" | "B" | "C" | "D" | "E" | "F";

export type AiReview = {
  traineeId: string;
  rank: AiRank;
  president: string;
  staff: string;
  self: string;
  communication: string;
};

export type Feedback = {
  insight: string;
  proposalDraft: string;
  karteHint: string;
};

export type AppData = {
  companies: Company[];
  trainees: Trainee[];
  placements: Placement[];
  reports: Report[];
  proposals: Proposal[];
  gates: GateRecord[];
  evaluations: Evaluation[];
  evaluationAddenda: EvaluationAddendum[];
  karteHints: KarteHint[];
  freshNotes: string[];
  risks: Risk[];
  roadmap: RoadmapYear[];
  interests: Interest[];
  staffReviews: StaffReview[];
  aiReviews: AiReview[];
};
