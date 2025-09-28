import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileNav } from '@/components/ui/mobile-nav';
import { 
  User, 
  Settings, 
  Package, 
  Gift,
  Shield,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';

import { Header } from '@/components/common/Header';
import PersonalInfo from '@/components/profile/PersonalInfo';
import OrderHistory from '@/components/profile/OrderHistory';
import LoyaltyDashboard from '@/components/profile/LoyaltyDashboard';
import CustomerPreferences from '@/components/profile/CustomerPreferences';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import { useTenant } from '@/contexts/TenantContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const { profileCompletion, stats, isLoading, error } = useCustomerProfile();
  const { tenant } = useTenant();

  const handleTabChange = (tab: string) => {
    if (tab === "home") {
      navigate("/");
    } else if (tab === "rewards") {
      navigate("/loyalty-rewards");
    } else if (tab === "shop") {
      navigate("/");
    }
    // If tab === "profile", stay on current page
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to view your profile.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.emailVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {tenant?.features.loyaltyProgram && stats && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {stats.loyaltyPoints} Points
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Completion */}
                {profileCompletion && (
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm text-gray-600">
                        {profileCompletion.completionPercentage}%
                      </span>
                    </div>
                    <Progress 
                      value={profileCompletion.completionPercentage} 
                      className="h-2"
                    />
                    {!profileCompletion.isComplete && (
                      <p className="text-xs text-gray-500 mt-1">
                        Complete your profile to unlock all features
                      </p>
                    )}
                  </div>
                )}

                {/* Quick Stats */}
                {stats && (
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalOrders}
                      </div>
                      <div className="text-xs text-gray-600">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${stats.totalSpent.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600">Spent</div>
                    </div>
                    {tenant?.features.loyaltyProgram && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {stats.loyaltyPoints}
                        </div>
                        <div className="text-xs text-gray-600">Points</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Suggestions */}
        {profileCompletion && !profileCompletion.isComplete && profileCompletion.suggestions.length > 0 && (
          <Alert className="mb-6">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Complete your profile:</div>
              <ul className="text-sm space-y-1">
                {profileCompletion.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            {tenant?.features.loyaltyProgram && (
              <TabsTrigger value="loyalty" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Loyalty</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PersonalInfo />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderHistory />
          </TabsContent>

          {tenant?.features.loyaltyProgram && (
            <TabsContent value="loyalty" className="space-y-6">
              <LoyaltyDashboard />
            </TabsContent>
          )}

          <TabsContent value="preferences" className="space-y-6">
            <CustomerPreferences />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-gray-600">
                        Last changed 3 months ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Login Sessions</h3>
                      <p className="text-sm text-gray-600">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Sessions
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Account Deletion</h3>
                      <p className="text-sm text-gray-600">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav 
          activeTab="profile" 
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

export default Profile;
