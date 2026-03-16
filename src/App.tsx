import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import GamesPage from "@/pages/Games";
import PresencePage from "@/pages/Presence";
import PaymentsPage from "@/pages/Payments";
import PlayersPage from "@/pages/Players";
import CashPage from "@/pages/Cash";
import StatsPage from "@/pages/Stats";
import AuthLoginPage from "@/pages/AuthLogin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const LoginRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthLoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth/login" element={<LoginRedirect />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/jogadores" element={<PlayersPage />} />
              <Route path="/jogos" element={<GamesPage />} />
              <Route path="/presenca" element={<PresencePage />} />
              <Route path="/pagamentos" element={<PaymentsPage />} />
              <Route path="/caixa" element={<CashPage />} />
              <Route path="/estatisticas" element={<StatsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
