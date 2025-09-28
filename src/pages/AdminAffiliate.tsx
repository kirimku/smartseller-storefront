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
  Users, 
  DollarSign, 
  TrendingUp, 
  Share2, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Search,
  Calendar,
  Gift,
  Award,
  CreditCard,
  Mail,
  Link2,
  BarChart3,
  Activity
} from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: 'active' | 'inactive' | 'suspended';
  totalEarnings: number;
  totalReferrals: number;
  conversionRate: number;
  joinDate: string;
  commissionRate: number;
  paymentMethod: string;
  lastActivity: string;
}

interface ReferralTransaction {
  id: string;
  affiliateId: string;
  affiliateName: string;
  referredUser: string;
  referredEmail: string;
  orderId: string;
  orderValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdDate: string;
  paidDate?: string;
  product: string;
  notes?: string;
}

interface PayoutRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestDate: string;
  processedDate?: string;
  paymentMethod: string;
  notes?: string;
}

const AdminAffiliate: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);

  // Mock data
  const affiliates: Affiliate[] = [
    {
      id: 'AFF001',
      name: 'Gaming Pro',
      email: 'gamingpro@email.com',
      referralCode: 'GMPRO2024',
      status: 'active',
      totalEarnings: 2450.00,
      totalReferrals: 45,
      conversionRate: 12.5,
      joinDate: '2024-01-15',
      commissionRate: 10,
      paymentMethod: 'PayPal',
      lastActivity: '2024-08-08'
    },
    {
      id: 'AFF002',
      name: 'TechReviewer',
      email: 'techrev@email.com',
      referralCode: 'TECHREV24',
      status: 'active',
      totalEarnings: 1850.50,
      totalReferrals: 32,
      conversionRate: 15.2,
      joinDate: '2024-02-20',
      commissionRate: 12,
      paymentMethod: 'Bank Transfer',
      lastActivity: '2024-08-09'
    },
    {
      id: 'AFF003',
      name: 'StreamerX',
      email: 'streamerx@email.com',
      referralCode: 'STREAMX',
      status: 'suspended',
      totalEarnings: 980.25,
      totalReferrals: 18,
      conversionRate: 8.5,
      joinDate: '2024-03-10',
      commissionRate: 8,
      paymentMethod: 'Crypto',
      lastActivity: '2024-07-25'
    }
  ];

  const referralTransactions: ReferralTransaction[] = [
    {
      id: 'RT001',
      affiliateId: 'AFF001',
      affiliateName: 'Gaming Pro',
      referredUser: 'John Doe',
      referredEmail: 'john@email.com',
      orderId: 'ORD-2024-001',
      orderValue: 299.99,
      commissionRate: 10,
      commissionAmount: 29.99,
      status: 'approved',
      createdDate: '2024-08-05',
      product: 'Rexus Gaming Headset MX-7',
      notes: 'First-time customer referral'
    },
    {
      id: 'RT002',
      affiliateId: 'AFF002',
      affiliateName: 'TechReviewer',
      referredUser: 'Sarah Smith',
      referredEmail: 'sarah@email.com',
      orderId: 'ORD-2024-002',
      orderValue: 199.99,
      commissionRate: 12,
      commissionAmount: 24.00,
      status: 'pending',
      createdDate: '2024-08-08',
      product: 'Rexus Gaming Keyboard K-9',
      notes: 'Review-based referral'
    },
    {
      id: 'RT003',
      affiliateId: 'AFF001',
      affiliateName: 'Gaming Pro',
      referredUser: 'Mike Johnson',
      referredEmail: 'mike@email.com',
      orderId: 'ORD-2024-003',
      orderValue: 89.99,
      commissionRate: 10,
      commissionAmount: 9.00,
      status: 'paid',
      createdDate: '2024-08-01',
      paidDate: '2024-08-07',
      product: 'Rexus Gaming Mouse M-15'
    }
  ];

  const payoutRequests: PayoutRequest[] = [
    {
      id: 'PR001',
      affiliateId: 'AFF001',
      affiliateName: 'Gaming Pro',
      amount: 150.00,
      status: 'pending',
      requestDate: '2024-08-08',
      paymentMethod: 'PayPal'
    },
    {
      id: 'PR002',
      affiliateId: 'AFF002',
      affiliateName: 'TechReviewer',
      amount: 200.00,
      status: 'approved',
      requestDate: '2024-08-05',
      processedDate: '2024-08-07',
      paymentMethod: 'Bank Transfer'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.referralCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateTransactionStatus = (transactionId: string, newStatus: string) => {
    console.log(`Updating transaction ${transactionId} to ${newStatus}`);
    // Update transaction status logic here
  };

  const handleProcessPayout = (payoutId: string, action: 'approve' | 'reject') => {
    console.log(`${action} payout ${payoutId}`);
    // Process payout logic here
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Program</h1>
          <p className="text-gray-600">Manage referral partners and track commission payments</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Add Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Affiliate</DialogTitle>
                <DialogDescription>
                  Create a new affiliate account with referral tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Affiliate name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="affiliate@email.com" />
                </div>
                <div>
                  <Label htmlFor="referralCode">Referral Code</Label>
                  <Input id="referralCode" placeholder="CUSTOM2024" />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input id="commissionRate" type="number" placeholder="10" />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Create Affiliate Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,280</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Orders</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,543</div>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">11.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Affiliates</CardTitle>
                <CardDescription>Based on commissions earned this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.slice(0, 5).map((affiliate, index) => (
                    <div key={affiliate.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-sm text-gray-500">{affiliate.referralCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${affiliate.totalEarnings}</p>
                        <p className="text-sm text-gray-500">{affiliate.totalReferrals} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest referral transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.affiliateName}</p>
                        <p className="text-sm text-gray-500">
                          Referred {transaction.referredUser} • ${transaction.orderValue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.commissionAmount}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search affiliates..."
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.name}</p>
                        <p className="text-sm text-gray-500">{affiliate.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{affiliate.referralCode}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell>${affiliate.totalEarnings}</TableCell>
                    <TableCell>{affiliate.totalReferrals}</TableCell>
                    <TableCell>{affiliate.conversionRate}%</TableCell>
                    <TableCell>{affiliate.commissionRate}%</TableCell>
                    <TableCell>{affiliate.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAffiliate(affiliate)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {affiliate.status === 'active' ? (
                          <Button size="sm" variant="outline">
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
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
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Referred Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Order Value</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline">{transaction.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.affiliateName}</p>
                        <p className="text-sm text-gray-500">{transaction.affiliateId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.referredUser}</p>
                        <p className="text-sm text-gray-500">{transaction.referredEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.orderId}</p>
                        <p className="text-sm text-gray-500">{transaction.product}</p>
                      </div>
                    </TableCell>
                    <TableCell>${transaction.orderValue}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${transaction.commissionAmount}</p>
                        <p className="text-sm text-gray-500">{transaction.commissionRate}%</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.createdDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {transaction.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTransactionStatus(transaction.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateTransactionStatus(transaction.id, 'rejected')}
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

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payouts..."
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
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Process Bulk Payout
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <Badge variant="outline">{payout.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.affiliateName}</p>
                        <p className="text-sm text-gray-500">{payout.affiliateId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${payout.amount}</TableCell>
                    <TableCell>{payout.paymentMethod}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>{payout.requestDate}</TableCell>
                    <TableCell>{payout.processedDate || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {payout.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayout(payout.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcessPayout(payout.id, 'reject')}
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Referral program performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Revenue chart would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
                <CardDescription>Click-to-purchase conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Conversion Rate</span>
                    <span className="font-medium">11.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Order Value</span>
                    <span className="font-medium">$196.43</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Commission</span>
                    <span className="font-medium">$19.64</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Top Product Category</span>
                    <span className="font-medium">Gaming Headsets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referral Sources</CardTitle>
                <CardDescription>Where your best referrals come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>YouTube Reviews</span>
                    </div>
                    <span className="font-medium">34%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4" />
                      <span>Social Media</span>
                    </div>
                    <span className="font-medium">28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4" />
                      <span>Blog Posts</span>
                    </div>
                    <span className="font-medium">23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Campaigns</span>
                    </div>
                    <span className="font-medium">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Settings</CardTitle>
                <CardDescription>Configure referral program parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="autoApprove">Auto-approve commissions</Label>
                  <Switch id="autoApprove" />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                  <Switch id="emailNotifications" defaultChecked />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="publicProgram">Public program registration</Label>
                  <Switch id="publicProgram" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
                  <Input id="defaultCommission" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPayout">Minimum Payout Amount ($)</Label>
                  <Input id="minPayout" type="number" defaultValue="50" />
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Affiliate Details Modal */}
      {selectedAffiliate && (
        <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Affiliate Details: {selectedAffiliate.name}</DialogTitle>
              <DialogDescription>
                View and manage affiliate account information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{selectedAffiliate.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedAffiliate.email}</p>
                </div>
                <div>
                  <Label>Referral Code</Label>
                  <p className="font-medium">{selectedAffiliate.referralCode}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedAffiliate.status)}
                </div>
                <div>
                  <Label>Total Earnings</Label>
                  <p className="font-medium">${selectedAffiliate.totalEarnings}</p>
                </div>
                <div>
                  <Label>Total Referrals</Label>
                  <p className="font-medium">{selectedAffiliate.totalReferrals}</p>
                </div>
                <div>
                  <Label>Conversion Rate</Label>
                  <p className="font-medium">{selectedAffiliate.conversionRate}%</p>
                </div>
                <div>
                  <Label>Commission Rate</Label>
                  <p className="font-medium">{selectedAffiliate.commissionRate}%</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => setIsEditingAffiliate(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Affiliate
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminAffiliate;
