import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileNav } from '@/components/ui/mobile-nav';
import { 
  User, 
  Star, 
  Gift, 
  Package, 
  Settings, 
  Bell, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Trophy,
  Shield,
  Edit,
  Camera,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  Gamepad2,
  Award,
  Target,
  TrendingUp,
  History,
  Lock,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/common/Header';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  avatar: string;
  joinDate: string;
  isAdmin: boolean;
  isVerified: boolean;
}

interface UserStats {
  totalPoints: number;
  pointsEarned: number;
  pointsSpent: number;
  level: number;
  nextLevelPoints: number;
  totalOrders: number;
  totalRedemptions: number;
  favoriteCategory: string;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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

  // Mock user data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user123',
    username: 'gaming_pro',
    email: 'john.doe@email.com',
    fullName: 'John Doe',
    phone: '+62 812-3456-7890',
    dateOfBirth: '1995-06-15',
    gender: 'male',
    avatar: '',
    joinDate: '2023-03-15',
    isAdmin: true, // Set to true to show admin access
    isVerified: true
  });

  const userStats: UserStats = {
    totalPoints: 15420,
    pointsEarned: 28340,
    pointsSpent: 12920,
    level: 7,
    nextLevelPoints: 2580,
    totalOrders: 24,
    totalRedemptions: 8,
    favoriteCategory: 'Gaming Headsets'
  };

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      fullName: 'John Doe',
      phone: '+62 812-3456-7890',
      address: 'Jl. Sudirman No. 123, Apartment Tower A, Unit 15B',
      city: 'Jakarta',
      state: 'DKI Jakarta',
      postalCode: '10220',
      country: 'Indonesia',
      isDefault: true
    },
    {
      id: '2',
      label: 'Office',
      fullName: 'John Doe',
      phone: '+62 812-3456-7890',
      address: 'Jl. Gatot Subroto No. 456, Office Building, Floor 12',
      city: 'Jakarta',
      state: 'DKI Jakarta',
      postalCode: '12930',
      country: 'Indonesia',
      isDefault: false
    }
  ]);

  const recentOrders = [
    {
      id: 'RXS-001',
      date: '2024-02-15',
      items: 'Rexus Gaming Mouse MX-5',
      points: 8500,
      status: 'Delivered'
    },
    {
      id: 'RXS-002',
      date: '2024-02-08',
      items: 'Rexus Gaming Keyboard KX-200',
      points: 12000,
      status: 'Delivered'
    },
    {
      id: 'RXS-003',
      date: '2024-01-28',
      items: 'Rexus Gaming Headset HX-7',
      points: 9800,
      status: 'Processing'
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'First Redemption',
      description: 'Complete your first points redemption',
      icon: <Gift className="w-6 h-6" />,
      unlocked: true,
      points: 100
    },
    {
      id: 2,
      title: 'Points Collector',
      description: 'Earn 10,000 points',
      icon: <Star className="w-6 h-6" />,
      unlocked: true,
      points: 500
    },
    {
      id: 3,
      title: 'Gaming Enthusiast',
      description: 'Redeem 5 gaming peripherals',
      icon: <Gamepad2 className="w-6 h-6" />,
      unlocked: true,
      points: 750
    },
    {
      id: 4,
      title: 'VIP Member',
      description: 'Reach Level 10',
      icon: <Crown className="w-6 h-6" />,
      unlocked: false,
      points: 1000
    }
  ];

  const handleSaveProfile = () => {
    // Save profile logic
    setIsEditing(false);
    console.log('Profile saved:', userProfile);
  };

  const handleAddressDelete = (addressId: string) => {
    setAddresses(addresses.filter(addr => addr.id !== addressId));
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
  };

  const getProgressPercentage = () => {
    const currentLevelPoints = userStats.pointsEarned % 5000; // Assuming 5000 points per level
    return (currentLevelPoints / 5000) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={userProfile.avatar} />
                    <AvatarFallback className="text-2xl">
                      {userProfile.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{userProfile.fullName}</h1>
                    {userProfile.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {userProfile.isAdmin && (
                      <Badge className="bg-purple-600 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2">@{userProfile.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(userProfile.joinDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {userProfile.isAdmin && (
                    <Button 
                      onClick={() => navigate('/admin')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                  <Button 
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">Level {userStats.level}</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{userStats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{userStats.totalRedemptions}</p>
                <p className="text-sm text-muted-foreground">Redemptions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Level {userStats.level}</span>
                    <span className="text-sm text-muted-foreground">
                      {userStats.nextLevelPoints} points to Level {userStats.level + 1}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Points Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Points Earned</span>
                    <span className="font-medium text-green-600">+{userStats.pointsEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points Spent</span>
                    <span className="font-medium text-red-600">-{userStats.pointsSpent.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Current Balance</span>
                    <span className="text-purple-600">{userStats.totalPoints.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.items}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{order.points.toLocaleString()} pts</p>
                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={userProfile.fullName}
                      onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userProfile.username}
                      onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={userProfile.dateOfBirth}
                      onChange={(e) => setUserProfile({...userProfile, dateOfBirth: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={userProfile.gender} 
                      onValueChange={(value) => setUserProfile({...userProfile, gender: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Shipping Addresses</h3>
                <p className="text-sm text-muted-foreground">Manage your delivery addresses</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>
            
            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{address.label}</h4>
                          {address.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{address.fullName}</p>
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.address}, {address.city}, {address.state} {address.postalCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!address.isDefault && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddressDelete(address.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Gaming Achievements
                </CardTitle>
                <CardDescription>
                  Unlock achievements to earn bonus points and show off your gaming dedication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`p-4 border rounded-lg ${
                        achievement.unlocked 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          achievement.unlocked 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <Badge 
                            variant={achievement.unlocked ? "default" : "secondary"}
                            className={achievement.unlocked ? "bg-green-600" : ""}
                          >
                            {achievement.unlocked ? "Unlocked" : "Locked"} • {achievement.points} pts
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive order updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive order updates via SMS</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Communications</h4>
                    <p className="text-sm text-muted-foreground">Receive promotional offers and news</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Once you delete your account, there is no going back. Please be certain.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab="profile" onTabChange={handleTabChange} />
    </div>
  );
};

export default Profile;
