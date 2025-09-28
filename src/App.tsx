import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Warranty from "./pages/Warranty";
import Referral from "./pages/Referral";
import SpinWin from "./pages/SpinWin";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminLogin from "./pages/AdminLogin";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import CreateOrder from "./pages/CreateOrder";
import TrackingStatus from "./pages/TrackingStatus";
import MarketplaceIntegration from "./pages/MarketplaceIntegration";
import WarrantyProgram from "./pages/WarrantyProgram";
import AdminAffiliate from "./pages/AdminAffiliate";
import LoyaltyRewards from "./pages/LoyaltyRewards";
import WarehouseManagement from "./pages/WarehouseManagement";
import ProductDetail from "./pages/ProductDetail";
import RedeemPage from "./pages/RedeemPage";
import RedemptionSuccess from "./pages/RedemptionSuccess";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/warranty" element={<Warranty />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/spin-win" element={<SpinWin />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/redeem/:productId" element={<RedeemPage />} />
          <Route path="/redemption-success" element={<RedemptionSuccess />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="tracking" element={<TrackingStatus />} />
            <Route path="marketplace" element={<MarketplaceIntegration />} />
            <Route path="warranty" element={<WarrantyProgram />} />
            <Route path="affiliate" element={<AdminAffiliate />} />
            <Route path="loyalty" element={<LoyaltyRewards />} />
            <Route path="warehouse" element={<WarehouseManagement />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
