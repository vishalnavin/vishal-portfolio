import { useState } from "react";
import { Gamepad2, X } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ChatWidget from "@/components/ChatWidget";
import RobotGame from "@/components/RobotGame";

const queryClient = new QueryClient();

const App = () => {
  const [gameActive, setGameActive] = useState(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ChatWidget />

          <RobotGame active={gameActive} />
          <button
            type="button"
            onClick={(e) => {
              // Ignore keyboard-triggered "clicks" (Space/Enter give detail === 0)
              // so the game starts only on a real pointer click.
              if (e.detail === 0) return;
              // Drop focus so Spacebar can't re-trigger the button afterwards
              e.currentTarget.blur();
              setGameActive((a) => !a);
            }}
            aria-pressed={gameActive}
            className={`game-launch-btn${gameActive ? " game-launch-btn--on" : ""}`}
          >
            {gameActive ? <X size={16} /> : <Gamepad2 size={16} />}
            {gameActive ? "Exit game" : "Play"}
          </button>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
