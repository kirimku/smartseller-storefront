import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  Star, 
  Package,
  Gift,
  Bell,
  Menu
} from "lucide-react";
import RexusLogo from "@/assets/Rexus_Logo.png";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header = ({ title, showBackButton, onBack }: HeaderProps) => {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mock user data - in a real app, this would come from context/state
  const user = {
    name: "John Doe",
    email: "john.doe@email.com",
    avatar: "",
    points: 15420,
    isAdmin: true
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleAdminClick = () => {
    navigate("/admin");
  };

  const handleLogout = () => {
    // Logout logic
    console.log("Logging out...");
    // navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src={RexusLogo}
                alt="Rexus"
                className="h-8 w-auto"
              />
              <div className="hidden sm:flex flex-col">
                <span className="font-semibold text-lg">Rexus</span>
                <span className="text-xs text-muted-foreground">Gaming Rewards</span>
              </div>
            </div>
          </div>

          {/* Center - Title */}
          {title && (
            <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
          )}

          {/* Right side - User Menu */}
          <div className="flex items-center gap-4">
            {/* Points Display */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              <Star className="w-4 h-4" />
              <span className="font-medium">{user.points.toLocaleString()}</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      {user.isAdmin && (
                        <Badge className="bg-purple-600 text-white text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* Points Summary */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Total Points</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      {user.points.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/loyalty-rewards")}>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>Rewards</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/my-orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Orders</span>
                </DropdownMenuItem>

                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAdminClick}>
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                navigate("/loyalty-rewards");
                setShowMobileMenu(false);
              }}
            >
              <Gift className="mr-2 h-4 w-4" />
              Rewards
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                navigate("/my-orders");
                setShowMobileMenu(false);
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              My Orders
            </Button>
            {user.isAdmin && (
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => {
                  handleAdminClick();
                  setShowMobileMenu(false);
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
