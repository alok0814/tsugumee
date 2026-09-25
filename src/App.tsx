import { useState } from "react";
import { BROWSER_NAME, COMPANY_ID, HERO_TRAINEE_ID } from "./data/program.ts";
import { Browse } from "./screens/Browse.tsx";
import { Interest } from "./screens/Interest.tsx";
import { Login } from "./screens/Login.tsx";
import { Board, Review } from "./screens/Owner.tsx";
import { Dashboard, Karte } from "./screens/Trainee.tsx";
import { StoreProvider, useStore } from "./state.tsx";
import { Shell } from "./ui.tsx";

type Mode = "browse" | "trainee" | "owner";
type OwnerTab = "interest" | "board" | "review";

type Route =
  | { name: "login" }
  | { name: "browse"; companyId?: string }
  | { name: "trainee" }
  | { name: "owner"; tab: OwnerTab; placementId?: string };

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

function Root() {
  const { data, reset, recordView } = useStore();
  const [route, setRoute] = useState<Route>({ name: "login" });
  const hero = data.trainees.find((trainee) => trainee.id === HERO_TRAINEE_ID);
  const president = data.companies.find((company) => company.id === COMPANY_ID);

  function onReset() {
    reset();
    setRoute({ name: "login" });
  }

  function onMode(mode: Mode) {
    if (mode === "browse") setRoute({ name: "browse" });
    if (mode === "trainee") setRoute({ name: "trainee" });
    if (mode === "owner") setRoute({ name: "owner", tab: "interest" });
  }

  if (route.name === "login") {
    return <Login onEnter={() => setRoute({ name: "browse" })} />;
  }

  const mode: Mode = route.name;
  const person =
    mode === "owner" ? (president?.presidentName ?? "木下 誠一") : mode === "trainee" ? (hero?.name ?? "高橋 葵") : BROWSER_NAME;

  const tabs =
    mode === "owner"
      ? [
          { id: "interest", label: "気になる" },
          { id: "board", label: "修行中" },
          ...(route.name === "owner" && route.placementId ? [{ id: "review", label: "見極め" }] : []),
        ]
      : mode === "trainee"
        ? [{ id: "dash", label: "修行" }]
        : [{ id: "list", label: "企業" }];

  const current =
    route.name === "owner" ? (route.tab === "review" && !route.placementId ? "interest" : route.tab) : route.name === "trainee" ? "dash" : "list";

  return (
    <Shell
      tabs={tabs}
      current={current}
      onTab={(id) => {
        if (route.name !== "owner") return;
        setRoute({ name: "owner", tab: id as OwnerTab, placementId: route.placementId });
      }}
      person={person}
      mode={mode}
      onMode={onMode}
      onReset={onReset}
    >
      {route.name === "browse" && !route.companyId ? (
        <Browse
          onOpen={(companyId) => {
            recordView(companyId);
            setRoute({ name: "browse", companyId });
          }}
        />
      ) : null}
      {route.name === "browse" && route.companyId ? (
        <Karte companyId={route.companyId} onBack={() => setRoute({ name: "browse" })} />
      ) : null}
      {route.name === "trainee" ? <Dashboard /> : null}
      {route.name === "owner" && current === "interest" ? <Interest /> : null}
      {route.name === "owner" && current === "board" ? (
        <Board onOpen={(placementId) => setRoute({ name: "owner", tab: "review", placementId })} />
      ) : null}
      {route.name === "owner" && current === "review" && route.placementId ? (
        <Review key={route.placementId} placementId={route.placementId} />
      ) : null}
    </Shell>
  );
}
