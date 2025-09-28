import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gift, 
  Star, 
  TrendingUp, 
  Award, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Search,
  Calendar,
  Plus,
  CreditCard,
  ShoppingBag,
  Ticket,
  Users,
  BarChart3,
  Activity,
  DollarSign,
  Package,
  Percent,
  Clock,
  Target,
  Mail
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'voucher' | 'product' | 'discount' | 'cashback';
  pointsRequired: number;
  value: number;
  currency?: string;
  discountType?: 'percentage' | 'fixed';
  productId?: string;
  productName?: string;
  voucherCode?: string;
  shopifyIntegration?: boolean;
  expiryDays: number;
  maxRedemptions: number;
  currentRedemptions: number;
  status: 'active' | 'inactive' | 'expired';
  createdDate: string;
  category: string;
  image?: string;
  terms?: string;
}

interface Redemption {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  status: 'pending' | 'approved' | 'delivered' | 'used' | 'expired' | 'cancelled';
  redemptionDate: string;
  deliveryDate?: string;
  expiryDate: string;
  voucherCode?: string;
  trackingNumber?: string;
  notes?: string;
}

interface PointsTransaction {
  id: string;
  userId: string;
  userName: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'refund';
  points: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  date: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending';
}

const LoyaltyRewards: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreatingReward, setIsCreatingReward] = useState(false);
  const [newReward, setNewReward] = useState<Partial<Reward>>({
    type: 'voucher',
    status: 'active',
    expiryDays: 30,
    maxRedemptions: 100
  });

  // Mock data
  const rewards: Reward[] = [
    {
      id: 'RW001',
      name: 'Shopify $10 Voucher',
      description: '10% discount voucher for any purchase',
      type: 'voucher',
      pointsRequired: 1000,
      value: 10,
      currency: 'USD',
      voucherCode: 'LOYALTY10',
      shopifyIntegration: true,
      expiryDays: 30,
      maxRedemptions: 500,
      currentRedemptions: 234,
      status: 'active',
      createdDate: '2024-08-01',
      category: 'Voucher',
      terms: 'Valid for single use only. Cannot be combined with other offers.'
    },
    {
      id: 'RW002',
      name: 'Rexus Gaming Headset MX-7',
      description: 'Premium gaming headset with 7.1 surround sound',
      type: 'product',
      pointsRequired: 5000,
      value: 299.99,
      currency: 'USD',
      productId: 'PROD-MX7',
      productName: 'Rexus Gaming Headset MX-7',
      expiryDays: 365,
      maxRedemptions: 50,
      currentRedemptions: 12,
      status: 'active',
      createdDate: '2024-07-15',
      category: 'Gaming Gear'
    },
    {
      id: 'RW003',
      name: '20% Discount Code',
      description: '20% off on any gaming accessory',
      type: 'discount',
      pointsRequired: 2500,
      value: 20,
      discountType: 'percentage',
      expiryDays: 60,
      maxRedemptions: 200,
      currentRedemptions: 89,
      status: 'active',
      createdDate: '2024-08-05',
      category: 'Discount'
    },
    {
      id: 'RW004',
      name: 'Cash Back $25',
      description: '$25 cashback to your account',
      type: 'cashback',
      pointsRequired: 3000,
      value: 25,
      currency: 'USD',
      expiryDays: 90,
      maxRedemptions: 100,
      currentRedemptions: 45,
      status: 'active',
      createdDate: '2024-07-20',
      category: 'Cashback'
    }
  ];

  const redemptions: Redemption[] = [
    {
      id: 'RED001',
      userId: 'USR001',
      userName: 'John Doe',
      userEmail: 'john@email.com',
      rewardId: 'RW001',
      rewardName: 'Shopify $10 Voucher',
      pointsUsed: 1000,
      status: 'delivered',
      redemptionDate: '2024-08-08',
      deliveryDate: '2024-08-08',
      expiryDate: '2024-09-07',
      voucherCode: 'LOYALTY10-ABC123'
    },
    {
      id: 'RED002',
      userId: 'USR002',
      userName: 'Sarah Smith',
      userEmail: 'sarah@email.com',
      rewardId: 'RW002',
      rewardName: 'Rexus Gaming Headset MX-7',
      pointsUsed: 5000,
      status: 'pending',
      redemptionDate: '2024-08-09',
      expiryDate: '2025-08-09'
    },
    {
      id: 'RED003',
      userId: 'USR003',
      userName: 'Mike Johnson',
      userEmail: 'mike@email.com',
      rewardId: 'RW003',
      rewardName: '20% Discount Code',
      pointsUsed: 2500,
      status: 'used',
      redemptionDate: '2024-08-05',
      deliveryDate: '2024-08-05',
      expiryDate: '2024-10-04',
      voucherCode: 'DISC20-XYZ789'
    }
  ];

  const pointsTransactions: PointsTransaction[] = [
    {
      id: 'PT001',
      userId: 'USR001',
      userName: 'John Doe',
      type: 'earned',
      points: 500,
      description: 'Purchase order #ORD-2024-001',
      orderId: 'ORD-2024-001',
      date: '2024-08-07',
      status: 'active'
    },
    {
      id: 'PT002',
      userId: 'USR001',
      userName: 'John Doe',
      type: 'redeemed',
      points: -1000,
      description: 'Redeemed Shopify $10 Voucher',
      rewardId: 'RW001',
      date: '2024-08-08',
      status: 'active'
    },
    {
      id: 'PT003',
      userId: 'USR002',
      userName: 'Sarah Smith',
      type: 'bonus',
      points: 1000,
      description: 'Birthday bonus points',
      date: '2024-08-01',
      status: 'active'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      used: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      earned: 'bg-green-100 text-green-800',
      redeemed: 'bg-red-100 text-red-800',
      bonus: 'bg-blue-100 text-blue-800',
      refund: 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getRewardTypeIcon = (type: string) => {
    const icons = {
      voucher: <Ticket className="h-4 w-4" />,
      product: <Package className="h-4 w-4" />,
      discount: <Percent className="h-4 w-4" />,
      cashback: <DollarSign className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons];
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reward.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateReward = () => {
    console.log('Creating reward:', newReward);
    setIsCreatingReward(false);
    setNewReward({
      type: 'voucher',
      status: 'active',
      expiryDays: 30,
      maxRedemptions: 100
    });
  };

  const handleUpdateRedemptionStatus = (redemptionId: string, newStatus: string) => {
    console.log(`Updating redemption ${redemptionId} to ${newStatus}`);
  };

  const generateVoucherCode = () => {
    const code = 'LOYAL' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setNewReward({ ...newReward, voucherCode: code });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Rewards</h1>
          <p className="text-gray-600">Manage loyalty points, rewards, and redemptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isCreatingReward} onOpenChange={setIsCreatingReward}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Reward</DialogTitle>
                <DialogDescription>
                  Set up a new reward with point conversion rates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rewardName">Reward Name</Label>
                    <Input 
                      id="rewardName" 
                      placeholder="Enter reward name"
                      value={newReward.name || ''}
                      onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rewardType">Reward Type</Label>
                    <Select 
                      value={newReward.type} 
                      onValueChange={(value) => setNewReward({ ...newReward, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="voucher">Voucher/Gift Card</SelectItem>
                        <SelectItem value="product">Physical Product</SelectItem>
                        <SelectItem value="discount">Discount Code</SelectItem>
                        <SelectItem value="cashback">Cashback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the reward"
                    value={newReward.description || ''}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsRequired">Points Required</Label>
                    <Input 
                      id="pointsRequired" 
                      type="number" 
                      placeholder="1000"
                      value={newReward.pointsRequired || ''}
                      onChange={(e) => setNewReward({ ...newReward, pointsRequired: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rewardValue">Reward Value ($)</Label>
                    <Input 
                      id="rewardValue" 
                      type="number" 
                      placeholder="10.00"
                      value={newReward.value || ''}
                      onChange={(e) => setNewReward({ ...newReward, value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                {newReward.type === 'voucher' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="voucherCode">Voucher Code</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="voucherCode" 
                            placeholder="LOYALTY10"
                            value={newReward.voucherCode || ''}
                            onChange={(e) => setNewReward({ ...newReward, voucherCode: e.target.value })}
                          />
                          <Button type="button" variant="outline" onClick={generateVoucherCode}>
                            Generate
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="shopifyIntegration"
                          checked={newReward.shopifyIntegration || false}
                          onCheckedChange={(checked) => setNewReward({ ...newReward, shopifyIntegration: checked })}
                        />
                        <Label htmlFor="shopifyIntegration">Shopify Integration</Label>
                      </div>
                    </div>
                  </div>
                )}

                {newReward.type === 'product' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productId">Product ID</Label>
                      <Input 
                        id="productId" 
                        placeholder="PROD-MX7"
                        value={newReward.productId || ''}
                        onChange={(e) => setNewReward({ ...newReward, productId: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input 
                        id="productName" 
                        placeholder="Gaming Headset"
                        value={newReward.productName || ''}
                        onChange={(e) => setNewReward({ ...newReward, productName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {newReward.type === 'discount' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select 
                        value={newReward.discountType} 
                        onValueChange={(value) => setNewReward({ ...newReward, discountType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discountValue">
                        {newReward.discountType === 'percentage' ? 'Percentage' : 'Amount'}
                      </Label>
                      <Input 
                        id="discountValue" 
                        type="number" 
                        placeholder={newReward.discountType === 'percentage' ? '20' : '25.00'}
                        value={newReward.value || ''}
                        onChange={(e) => setNewReward({ ...newReward, value: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDays">Expiry (Days)</Label>
                    <Input 
                      id="expiryDays" 
                      type="number" 
                      placeholder="30"
                      value={newReward.expiryDays || ''}
                      onChange={(e) => setNewReward({ ...newReward, expiryDays: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                    <Input 
                      id="maxRedemptions" 
                      type="number" 
                      placeholder="100"
                      value={newReward.maxRedemptions || ''}
                      onChange={(e) => setNewReward({ ...newReward, maxRedemptions: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    placeholder="Gaming Gear"
                    value={newReward.category || ''}
                    onChange={(e) => setNewReward({ ...newReward, category: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea 
                    id="terms" 
                    placeholder="Terms and conditions for this reward"
                    value={newReward.terms || ''}
                    onChange={(e) => setNewReward({ ...newReward, terms: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatingReward(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReward}>
                    Create Reward
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="points">Points Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+3 this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125,430</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Redemptions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23.8%</div>
                <p className="text-xs text-muted-foreground">+2.3% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Rewards</CardTitle>
                <CardDescription>Most redeemed rewards this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rewards.slice(0, 5).map((reward, index) => (
                    <div key={reward.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {getRewardTypeIcon(reward.type)}
                        </div>
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          <p className="text-sm text-gray-500">{reward.pointsRequired} points</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{reward.currentRedemptions}</p>
                        <p className="text-sm text-gray-500">redeemed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Redemptions</CardTitle>
                <CardDescription>Latest customer redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redemptions.slice(0, 5).map((redemption) => (
                    <div key={redemption.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{redemption.userName}</p>
                        <p className="text-sm text-gray-500">
                          {redemption.rewardName} • {redemption.pointsUsed} points
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{redemption.redemptionDate}</p>
                        {getStatusBadge(redemption.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Required</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-sm text-gray-500">{reward.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRewardTypeIcon(reward.type)}
                        <span className="capitalize">{reward.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{reward.pointsRequired} pts</Badge>
                    </TableCell>
                    <TableCell>
                      {reward.type === 'discount' ? (
                        <span>{reward.value}{reward.discountType === 'percentage' ? '%' : '$'}</span>
                      ) : (
                        <span>${reward.value}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{reward.currentRedemptions}</span>
                        <span className="text-gray-500">/{reward.maxRedemptions}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reward.status)}</TableCell>
                    <TableCell>{reward.createdDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search redemptions..."
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Redemption ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Points Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <Badge variant="outline">{redemption.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{redemption.userName}</p>
                        <p className="text-sm text-gray-500">{redemption.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{redemption.rewardName}</p>
                        {redemption.voucherCode && (
                          <p className="text-sm text-gray-500">Code: {redemption.voucherCode}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{redemption.pointsUsed} pts</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(redemption.status)}</TableCell>
                    <TableCell>{redemption.redemptionDate}</TableCell>
                    <TableCell>{redemption.expiryDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {redemption.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRedemptionStatus(redemption.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRedemptionStatus(redemption.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Manual Points Adjustment
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointsTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline">{transaction.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{transaction.userName}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.type)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Redemption Analytics</CardTitle>
                <CardDescription>Points redemption trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Redemption analytics chart would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Point Conversion Rates</CardTitle>
                <CardDescription>Efficiency of different reward types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Ticket className="h-4 w-4" />
                    <span>Vouchers</span>
                  </div>
                  <span className="font-medium">45.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Products</span>
                  </div>
                  <span className="font-medium">28.7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Percent className="h-4 w-4" />
                    <span>Discounts</span>
                  </div>
                  <span className="font-medium">18.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Cashback</span>
                  </div>
                  <span className="font-medium">7.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Settings</CardTitle>
                <CardDescription>Configure loyalty program parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerDollar">Points per Dollar Spent</Label>
                  <Input id="pointsPerDollar" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsExpiry">Points Expiry (Days)</Label>
                  <Input id="pointsExpiry" type="number" defaultValue="365" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minRedemption">Minimum Redemption Points</Label>
                  <Input id="minRedemption" type="number" defaultValue="100" />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="autoApprove">Auto-approve redemptions</Label>
                  <Switch id="autoApprove" />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                  <Switch id="emailNotifications" defaultChecked />
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common loyalty program tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="mr-2 h-4 w-4" />
                  Bulk Points Adjustment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Expire Points
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Points Reminder
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Gift className="mr-2 h-4 w-4" />
                  Create Bonus Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyRewards;
