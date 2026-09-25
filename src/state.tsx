import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { seed } from "./data/seed.ts";
import {
  BROWSER_AFFILIATION,
  BROWSER_NAME,
  BROWSER_PROFILE,
  COMPANY_ID,
  DEMO_TODAY,
  HERO_PLACEMENT_ID,
  HERO_TRAINEE_ID,
  STAGE2_MISSIONS,
  STAGE3_MISSIONS,
} from "./data/program.ts";
import {
  extractQuote,
  generateReportFeedback,
  organizeSpoken,
  viewpointTitleFor,
} from "./lib/ai.ts";
import { addDays, formatDate, uid } from "./lib/format.ts";
import type {
  AppData,
  Feedback,
  GateDecision,
  ProposalReaction,
} from "./types.ts";

const STORAGE_KEY = "tsugime-mvp-v6";

type Store = {
  data: AppData;
  addReport: (body: string) => Feedback | { error: string };
  publishProposal: (content: string) => void;
  setReaction: (proposalId: string, reaction: ProposalReaction) => void;
  decideGate: (
    placementId: string,
    decision: GateDecision,
    agreement: boolean,
    comment: string,
  ) => string | null;
  organize: (spoken: string) => string | null;
  toggleInterest: (companyId: string) => void;
  markIntent: (companyId: string) => void;
  sendOffer: (interestId: string) => void;
  addPresidentReport: (placementId: string, body: string) => void;
  updateReport: (reportId: string, body: string) => void;
  recordView: (companyId: string) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.companies || !parsed.placements || !parsed.reports || !parsed.interests) {
      return structuredClone(seed);
    }
    return parsed;
  } catch {
    return structuredClone(seed);
  }
}

const DEFAULT_COMMENT: Record<GateDecision, string> = {
  "次の段階へ": "次の段階へ進める。",
  もう1ヶ月: "もう1ヶ月、同じ段階で見る。",
  ここまで: "ここまでとする。",
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addReport = (body: string): Feedback | { error: string } => {
    const text = body.trim();
    if (!text) return { error: "日報を書いてから送ってください。" };
    const company = data.companies.find((item) => item.id === COMPANY_ID) ?? data.companies[0];
    const feedback = generateReportFeedback(text, company);
    const quote = extractQuote(text);
    const date = DEMO_TODAY;
    const placement = data.placements.find((item) => item.id === HERO_PLACEMENT_ID);
    const traineeId = placement?.traineeId ?? HERO_TRAINEE_ID;
    const title = viewpointTitleFor(text);
    setData((prev) => ({
      ...prev,
      reports: [
        ...prev.reports,
        {
          id: uid("r"),
          placementId: HERO_PLACEMENT_ID,
          date,
          body: text,
          insight: feedback.insight,
          proposalDraft: feedback.proposalDraft,
          karteHint: feedback.karteHint,
        },
      ],
      karteHints: [...prev.karteHints, { date, text: feedback.karteHint }],
      freshNotes: [
        ...prev.freshNotes,
        quote
          ? `${formatDate(date)}の日報「${quote}」を、属人化のリスクに足した。見積か電話が社長のままなら、このリスクは残る。`
          : `${formatDate(date)}の日報が1件増えた。引用は取れなかったが、記録は増えている。`,
      ],
      evaluationAddenda: [
        ...prev.evaluationAddenda,
        {
          traineeId,
          title,
          text: quote
            ? `${formatDate(date)}の日報を根拠に足した。「${quote}」`
            : `${formatDate(date)}の日報を、この観点の記録に足した。`,
        },
      ],
    }));
    return feedback;
  };

  const publishProposal = (content: string) => {
    const text = content.trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      proposals: [
        ...prev.proposals,
        {
          id: uid("pr"),
          placementId: HERO_PLACEMENT_ID,
          date: DEMO_TODAY,
          content: text,
          reaction: null,
        },
      ],
    }));
  };

  const setReaction = (proposalId: string, reaction: ProposalReaction) => {
    setData((prev) => ({
      ...prev,
      proposals: prev.proposals.map((proposal) =>
        proposal.id === proposalId ? { ...proposal, reaction } : proposal,
      ),
    }));
  };

  const decideGate = (
    placementId: string,
    decision: GateDecision,
    agreement: boolean,
    comment: string,
  ): string | null => {
    const current = data.placements.find((item) => item.id === placementId);
    if (!current || current.stage === "ended") {
      return "この修行は終了しています。";
    }
    if (decision === "次の段階へ" && current.stage === 1 && !agreement) {
      return "段階2に進めるには、承継を前提とした合意書のチェックが必要です。";
    }
    const note = comment.trim() || DEFAULT_COMMENT[decision];
    const stageAtDecision = current.stage;
    setData((prev) => ({
      ...prev,
      placements: prev.placements.map((placement) => {
        if (placement.id !== placementId || placement.stage === "ended") return placement;
        if (decision === "もう1ヶ月") {
          const base = placement.gateDate ?? DEMO_TODAY;
          return { ...placement, gateDate: addDays(base, 30) };
        }
        if (decision === "ここまで") {
          return {
            ...placement,
            stage: "ended" as const,
            gateDate: null,
            endedOn: DEMO_TODAY,
            endReason: "見送り" as const,
            endComment: note,
          };
        }
        if (placement.stage === 1) {
          return {
            ...placement,
            stage: 2 as const,
            hasAgreement: true,
            simpleWorkOnly: false,
            gateDate: addDays(DEMO_TODAY, 60),
            missions: STAGE2_MISSIONS,
          };
        }
        if (placement.stage === 2) {
          return {
            ...placement,
            stage: 3 as const,
            gateDate: addDays(DEMO_TODAY, 60),
            missions: STAGE3_MISSIONS,
          };
        }
        return {
          ...placement,
          stage: "ended" as const,
          gateDate: null,
          endedOn: DEMO_TODAY,
          endReason: "承継" as const,
          endComment: note,
        };
      }),
      gates: [
        ...prev.gates,
        {
          id: uid("g"),
          placementId,
          stage: stageAtDecision,
          decision,
          comment: note,
          date: DEMO_TODAY,
        },
      ],
    }));
    return null;
  };

  const organize = (spoken: string): string | null => {
    try {
      const current = data.companies.find((item) => item.id === COMPANY_ID) ?? data.companies[0];
      const next = organizeSpoken(spoken, current);
      setData((prev) => ({
        ...prev,
        companies: prev.companies.map((item) =>
          item.id === current.id ? { ...item, ...next } : item,
        ),
      }));
      return null;
    } catch {
      return "話し言葉が短すぎます。現場の困りごとが分かる長さで書いてください。";
    }
  };

  const toggleInterest = (companyId: string) => {
    setData((prev) => {
      const mine = prev.interests.find((item) => item.mine && item.companyId === companyId);
      if (mine?.kind === "応募意向") return prev;
      if (mine) {
        return { ...prev, interests: prev.interests.filter((item) => item.id !== mine.id) };
      }
      return {
        ...prev,
        interests: [
          ...prev.interests,
          {
            id: uid("in"),
            companyId,
            name: BROWSER_NAME,
            affiliation: BROWSER_AFFILIATION,
            kind: "気になる" as const,
            offered: false,
            mine: true,
            ...BROWSER_PROFILE,
          },
        ],
      };
    });
  };

  const markIntent = (companyId: string) => {
    setData((prev) => {
      const mine = prev.interests.find((item) => item.mine && item.companyId === companyId);
      if (mine) {
        return {
          ...prev,
          interests: prev.interests.map((item) =>
            item.id === mine.id ? { ...item, kind: "応募意向" as const } : item,
          ),
        };
      }
      return {
        ...prev,
        interests: [
          ...prev.interests,
          {
            id: uid("in"),
            companyId,
            name: BROWSER_NAME,
            affiliation: BROWSER_AFFILIATION,
            kind: "応募意向" as const,
            offered: false,
            mine: true,
            ...BROWSER_PROFILE,
          },
        ],
      };
    });
  };

  const sendOffer = (interestId: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.map((item) =>
        item.id === interestId ? { ...item, offered: true } : item,
      ),
    }));
  };

  const addPresidentReport = (placementId: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      reports: [
        ...prev.reports,
        {
          id: uid("r"),
          placementId,
          date: DEMO_TODAY,
          body: text,
          by: "president" as const,
        },
      ],
    }));
  };

  const updateReport = (reportId: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      reports: prev.reports.map((item) => (item.id === reportId ? { ...item, body: text } : item)),
    }));
  };

  const recordView = (companyId: string) => {
    setData((prev) => ({
      ...prev,
      companies: prev.companies.map((item) =>
        item.id === companyId ? { ...item, views: item.views + 1 } : item,
      ),
    }));
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(structuredClone(seed));
  };

  return (
    <StoreContext.Provider
      value={{
        data,
        addReport,
        publishProposal,
        setReaction,
        decideGate,
        organize,
        toggleInterest,
        markIntent,
        sendOffer,
        addPresidentReport,
        updateReport,
        recordView,
        reset,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("StoreProvider の外で useStore が呼ばれました。");
  return store;
}
