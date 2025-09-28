import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Gift,
  Calendar,
  MessageSquare
} from "lucide-react";

// Mock data
const stats = [
  {
    title: "Total Revenue",
    value: "Rp 125,420,000",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Total Users",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Total Orders",
    value: "892",
    change: "+15.3%",
    trend: "up",
    icon: ShoppingCart,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    title: "Products",
    value: "156",
    change: "-2.1%",
    trend: "down",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }
];

const recentOrders = [
  {
    id: "ORD001",
    customer: "John Doe",
    product: "Gaming Keyboard RGB",
    amount: "Rp 750,000",
    status: "completed",
    date: "2024-08-10"
  },
  {
    id: "ORD002",
    customer: "Jane Smith",
    product: "Gaming Mouse Pro",
    amount: "Rp 450,000",
    status: "processing",
    date: "2024-08-10"
  },
  {
    id: "ORD003",
    customer: "Mike Johnson",
    product: "Gaming Headset",
    amount: "Rp 890,000",
    status: "shipped",
    date: "2024-08-09"
  },
  {
    id: "ORD004",
    customer: "Sarah Wilson",
    product: "Mousepad XL",
    amount: "Rp 150,000",
    status: "pending",
    date: "2024-08-09"
  },
  {
    id: "ORD005",
    customer: "David Brown",
    product: "Gaming Chair",
    amount: "Rp 2,100,000",
    status: "completed",
    date: "2024-08-08"
  }
];

const topProducts = [
  {
    name: "Gaming Keyboard RGB",
    sales: 156,
    revenue: "Rp 117,000,000",
    trend: "up"
  },
  {
    name: "Gaming Mouse Pro",
    sales: 134,
    revenue: "Rp 60,300,000",
    trend: "up"
  },
  {
    name: "Gaming Headset",
    sales: 98,
    revenue: "Rp 87,220,000",
    trend: "down"
  },
  {
    name: "Mousepad XL",
    sales: 89,
    revenue: "Rp 13,350,000",
    trend: "up"
  },
  {
    name: "Gaming Chair",
    sales: 45,
    revenue: "Rp 94,500,000",
    trend: "up"
  }
];

const activities = [
  {
    type: "order",
    message: "New order from John Doe",
    time: "2 minutes ago",
    icon: ShoppingCart
  },
  {
    type: "user",
    message: "New user registration: jane.smith@example.com",
    time: "15 minutes ago",
    icon: Users
  },
  {
    type: "review",
    message: "New 5-star review for Gaming Keyboard RGB",
    time: "1 hour ago",
    icon: Star
  },
  {
    type: "support",
    message: "Support ticket #1245 resolved",
    time: "2 hours ago",
    icon: MessageSquare
  },
  {
    type: "promotion",
    message: "Flash deal started: Gaming Mouse Pro",
    time: "3 hours ago",
    icon: Gift
  }
];

export default function AdminDashboard() {
  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return <Badge className={variants[status] || variants.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.date)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.product}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sales} sales</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{product.revenue}</div>
                  <div className="flex items-center gap-1">
                    {product.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${
                      product.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {product.trend === "up" ? "+5.2%" : "-2.1%"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Gift className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Flash Deal
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
