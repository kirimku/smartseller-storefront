import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Gift, 
  Trophy, 
  Crown, 
  Zap, 
  Calendar, 
  TrendingUp,
  Award,
  Coins,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LoyaltyData {
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: {
    name: string;
    level: number;
    color: string;
    icon: React.ReactNode;
    benefits: string[];
    minPoints: number;
    maxPoints?: number;
  };
  nextTier?: {
    name: string;
    level: number;
    minPoints: number;
    pointsNeeded: number;
  };
  recentActivity: LoyaltyActivity[];
  availableRewards: Reward[];
  expiringPoints?: {
    amount: number;
    expiryDate: string;
  };
}

interface LoyaltyActivity {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  date: string;
  orderId?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  category: 'discount' | 'freebie' | 'exclusive' | 'shipping';
  expiryDate?: string;
  termsAndConditions: string[];
  available: boolean;
}

const LoyaltyDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { tenant } = useTenant();
  
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock loyalty data
  const mockLoyaltyData: LoyaltyData = {
    currentPoints: 2450,
    totalEarned: 5680,
    totalRedeemed: 3230,
    tier: {
      name: 'Gold',
      level: 3,
      color: 'text-yellow-600',
      icon: <Crown className="h-5 w-5" />,
      benefits: [
        'Free shipping on all orders',
        '15% birthday discount',
        'Early access to sales',
        'Priority customer support',
        'Exclusive member events'
      ],
      minPoints: 2000,
      maxPoints: 5000
    },
    nextTier: {
      name: 'Platinum',
      level: 4,
      minPoints: 5000,
      pointsNeeded: 2550
    },
    recentActivity: [
      {
        id: '1',
        type: 'earned',
        points: 150,
        description: 'Purchase reward - Order #ORD-2024-001',
        date: '2024-01-15T10:30:00Z',
        orderId: 'ORD-2024-001'
      },
      {
        id: '2',
        type: 'redeemed',
        points: -500,
        description: 'Redeemed: $25 Store Credit',
        date: '2024-01-10T14:20:00Z'
      },
      {
        id: '3',
        type: 'earned',
        points: 100,
        description: 'Product review bonus',
        date: '2024-01-08T09:15:00Z'
      },
      {
        id: '4',
        type: 'earned',
        points: 200,
        description: 'Referral bonus - Friend joined',
        date: '2024-01-05T16:45:00Z'
      }
    ],
    availableRewards: [
      {
        id: '1',
        name: '$10 Store Credit',
        description: 'Get $10 off your next purchase',
        pointsCost: 500,
        image: '/api/placeholder/100/100',
        category: 'discount',
        termsAndConditions: [
          'Valid for 30 days from redemption',
          'Cannot be combined with other offers',
          'Minimum purchase of $50 required'
        ],
        available: true
      },
      {
        id: '2',
        name: 'Free Shipping',
        description: 'Free shipping on your next order',
        pointsCost: 200,
        image: '/api/placeholder/100/100',
        category: 'shipping',
        termsAndConditions: [
          'Valid for 14 days from redemption',
          'Applies to standard shipping only'
        ],
        available: true
      },
      {
        id: '3',
        name: 'Exclusive T-Shirt',
        description: 'Limited edition member-only t-shirt',
        pointsCost: 1000,
        image: '/api/placeholder/100/100',
        category: 'exclusive',
        expiryDate: '2024-03-31',
        termsAndConditions: [
          'Limited quantities available',
          'Size selection required',
          'Cannot be exchanged or returned'
        ],
        available: true
      },
      {
        id: '4',
        name: '$50 Store Credit',
        description: 'Get $50 off your next purchase',
        pointsCost: 2500,
        image: '/api/placeholder/100/100',
        category: 'discount',
        termsAndConditions: [
          'Valid for 60 days from redemption',
          'Cannot be combined with other offers',
          'Minimum purchase of $100 required'
        ],
        available: false
      }
    ],
    expiringPoints: {
      amount: 300,
      expiryDate: '2024-02-15T00:00:00Z'
    }
  };

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    if (!tenant?.features.loyaltyProgram) {
      setIsLoadingLoyalty(false);
      return;
    }

    setIsLoadingLoyalty(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // const response = await loyaltyService.getLoyaltyData();
      // setLoyaltyData(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setLoyaltyData(mockLoyaltyData);
        setIsLoadingLoyalty(false);
      }, 1000);
    } catch (error) {
      setError('Failed to load loyalty data');
      setIsLoadingLoyalty(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      // In a real app, this would be an API call
      // await loyaltyService.redeemReward(rewardId);
      
      // Mock implementation
      console.log('Redeeming reward:', rewardId);
      // Reload data after redemption
      loadLoyaltyData();
    } catch (error) {
      setError('Failed to redeem reward');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: LoyaltyActivity['type']) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'redeemed':
        return <Gift className="h-4 w-4 text-blue-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: Reward['category']) => {
    switch (category) {
      case 'discount':
        return <Coins className="h-4 w-4" />;
      case 'freebie':
        return <Gift className="h-4 w-4" />;
      case 'exclusive':
        return <Star className="h-4 w-4" />;
      case 'shipping':
        return <Zap className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tenant?.features.loyaltyProgram) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loyalty Program Not Available</h3>
          <p className="text-muted-foreground">
            The loyalty program is not enabled for this store.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingLoyalty) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !loyaltyData) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>{error || 'Failed to load loyalty data'}</AlertDescription>
      </Alert>
    );
  }

  const tierProgress = loyaltyData.tier.maxPoints 
    ? ((loyaltyData.currentPoints - loyaltyData.tier.minPoints) / (loyaltyData.tier.maxPoints - loyaltyData.tier.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Trophy className="h-6 w-6" />
            <span>Loyalty Dashboard</span>
          </h2>
          <p className="text-muted-foreground">
            Track your points, rewards, and tier status
          </p>
        </div>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Points</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyData.currentPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available to redeem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyData.totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime points earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyData.totalRedeemed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Points used for rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Tier Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-gray-100 ${loyaltyData.tier.color}`}>
                {loyaltyData.tier.icon}
              </div>
              <div>
                <h3 className="font-semibold">{loyaltyData.tier.name} Member</h3>
                <p className="text-sm text-muted-foreground">
                  Level {loyaltyData.tier.level}
                </p>
              </div>
            </div>
            
            {loyaltyData.nextTier && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {loyaltyData.nextTier.pointsNeeded} points to {loyaltyData.nextTier.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Next tier level {loyaltyData.nextTier.level}
                </p>
              </div>
            )}
          </div>

          {loyaltyData.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{loyaltyData.tier.name}</span>
                <span>{loyaltyData.nextTier.name}</span>
              </div>
              <Progress value={tierProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {loyaltyData.currentPoints} / {loyaltyData.nextTier.minPoints} points
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Your Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {loyaltyData.tier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Points Alert */}
      {loyaltyData.expiringPoints && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>{loyaltyData.expiringPoints.amount} points</strong> will expire on{' '}
            <strong>{formatDate(loyaltyData.expiringPoints.expiryDate)}</strong>.
            Use them before they're gone!
          </AlertDescription>
        </Alert>
      )}

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>Available Rewards</span>
          </CardTitle>
          <CardDescription>
            Redeem your points for exclusive rewards and benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyData.availableRewards.map((reward) => (
              <Card key={reward.id} className={!reward.available ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <img
                        src={reward.image}
                        alt={reward.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        {getCategoryIcon(reward.category)}
                        <span className="capitalize">{reward.category}</span>
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{reward.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {reward.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{reward.pointsCost}</span>
                      </div>
                      
                      {reward.expiryDate && (
                        <p className="text-xs text-muted-foreground">
                          Expires {formatDate(reward.expiryDate)}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!reward.available || loyaltyData.currentPoints < reward.pointsCost}
                      onClick={() => redeemReward(reward.id)}
                    >
                      {!reward.available ? 'Unavailable' :
                       loyaltyData.currentPoints < reward.pointsCost ? 'Insufficient Points' :
                       'Redeem'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>
            Your latest points transactions and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    activity.type === 'earned' ? 'text-green-600' : 
                    activity.type === 'redeemed' ? 'text-blue-600' : 
                    'text-red-600'
                  }`}>
                    {activity.type === 'earned' ? '+' : ''}{activity.points}
                  </p>
                  {activity.orderId && (
                    <p className="text-xs text-muted-foreground">
                      {activity.orderId}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyDashboard;