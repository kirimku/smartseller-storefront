import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Shield, 
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Home,
  Gift,
  Ticket,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  Route,
  Globe,
  Share2,
  Award,
  Warehouse
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/admin",
    badge: null
  },
  {
    title: "Customer",
    icon: Users,
    href: "/admin/users",
    badge: "124"
  },
  {
    title: "Product",
    icon: Package,
    href: "/admin/products",
    badge: null
  },
  {
    title: "Order",
    icon: ShoppingCart,
    href: "/admin/orders",
    badge: "12"
  },
  {
    title: "Tracking & Delivery",
    icon: Route,
    href: "/admin/tracking",
    badge: "2"
  },
  {
    title: "Marketplace Integration",
    icon: Globe,
    href: "/admin/marketplace",
    badge: null
  },
  {
    title: "Warranty Program",
    icon: Shield,
    href: "/admin/warranty",
    badge: "5"
  },
  {
    title: "Affiliate Program",
    icon: Share2,
    href: "/admin/affiliate",
    badge: "12"
  },
  {
    title: "Loyalty Rewards",
    icon: Award,
    href: "/admin/loyalty",
    badge: "8"
  },
  {
    title: "Warehouse",
    icon: Warehouse,
    href: "/admin/warehouse",
    badge: "3"
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
    badge: null
  },
  {
    title: "Promotions",
    icon: Gift,
    href: "/admin/promotions",
    badge: "3"
  },
  {
    title: "Flash Deals",
    icon: Ticket,
    href: "/admin/flash-deals",
    badge: null
  },
  {
    title: "Reviews",
    icon: Star,
    href: "/admin/reviews",
    badge: "8"
  },
  {
    title: "Support",
    icon: MessageSquare,
    href: "/admin/support",
    badge: "5"
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
    badge: null
  }
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Rexus Admin</h2>
                  <p className="text-xs text-gray-500">Control Panel</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">AD</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@rexus.com</p>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {location.pathname === "/admin" ? "Dashboard" : 
                 location.pathname === "/admin/users" ? "User Management" :
                 location.pathname === "/admin/products" ? "Product Management" :
                 location.pathname === "/admin/orders" ? "Order Management" :
                 location.pathname === "/admin/tracking" ? "Tracking & Delivery" :
                 location.pathname === "/admin/marketplace" ? "Marketplace Integration" :
                 location.pathname === "/admin/warranty" ? "Warranty Program" :
                 location.pathname === "/admin/affiliate" ? "Affiliate Program" :
                 location.pathname === "/admin/loyalty" ? "Loyalty Rewards" :
                 location.pathname === "/admin/warehouse" ? "Warehouse Management" :
                 location.pathname === "/admin/analytics" ? "Analytics" :
                 "Admin Panel"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>

              {/* Profile */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
