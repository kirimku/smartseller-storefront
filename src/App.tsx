import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantLoader, TenantError } from "@/components/common/TenantLoader";
import TokenExpirationAlert from "@/components/TokenExpirationAlert";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Warranty from "./pages/Warranty";
import Referral from "./pages/Referral";
import SpinWin from "./pages/SpinWin";
import LoyaltyRewards from "./pages/LoyaltyRewards";
import ProductDetail from "./pages/ProductDetail";
import RedeemPage from "./pages/RedeemPage";
import RedemptionSuccess from "./pages/RedemptionSuccess";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import Register from "./pages/Register";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const TenantAwareApp = () => {
  const { tenant, isLoading, error, subdomain } = useTenant();

  if (isLoading) {
    return <TenantLoader message="Loading your storefront..." />;
  }

  if (error || !tenant) {
    return (
      <TenantError 
        error={error || "Tenant configuration not found"} 
        subdomain={subdomain}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <BrowserRouter>
      <TokenExpirationAlert 
        position="top-right"
        autoHide={false}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/warranty" element={<Warranty />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/spin-win" element={<SpinWin />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/redeem/:productId" element={<RedeemPage />} />
        <Route path="/redemption-success" element={<RedemptionSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/loyalty" element={<LoyaltyRewards />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <TenantAwareApp />
        </AuthProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
