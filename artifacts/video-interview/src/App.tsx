import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "./i18n";

import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Positions from "./pages/positions";
import ApplyFlow from "./pages/apply";
import Register from "./pages/register";
import LoginCandidato from "./pages/login-candidato";
import MyApplications from "./pages/my-applications";
import TestHarid from "./pages/test-harid";
import PositionDetail from "./pages/position-detail";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/positions" component={Positions} />
      <Route path="/positions/:id" component={PositionDetail} />
      <Route path="/apply/:positionId" component={ApplyFlow} />
      <Route path="/register" component={Register} />
      <Route path="/login-candidato" component={LoginCandidato} />
      <Route path="/my-applications" component={MyApplications} />
      <Route path="/test-harid" component={TestHarid} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode globally
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "hsl(226 47% 6%)";
  }, []);

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
