import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter,
  Eye,
  Package,
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Phone,
  Mail,
  User,
  FileText,
  Navigation,
  History,
  Info,
  ExternalLink,
  Copy,
  Bell,
  Route
} from "lucide-react";

type TrackingStatus = "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "returned";

type TrackingEvent = {
  id: string;
  timestamp: string;
  status: TrackingStatus;
  location: string;
  description: string;
  details?: string;
  operator?: string;
};

type ShippingDetail = {
  trackingNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  currentStatus: TrackingStatus;
  estimatedDelivery: string;
  actualDelivery?: string;
  shippingMethod: string;
  shippingProvider: string;
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  package: {
    weight: number;
    dimensions: string;
    items: number;
    value: number;
  };
  events: TrackingEvent[];
  createdAt: string;
  notes?: string;
};

// Mock tracking data
const mockTrackingData: ShippingDetail[] = [
  {
    trackingNumber: "REX123456789",
    orderId: "ORD001",
    orderNumber: "RXS-2024-08-001",
    customerId: "USR001",
    customerName: "John Doe",
    customerPhone: "+62812345678",
    customerEmail: "john.doe@example.com",
    currentStatus: "delivered",
    estimatedDelivery: "2024-08-13",
    actualDelivery: "2024-08-13",
    shippingMethod: "Express Delivery",
    shippingProvider: "REX Express",
    origin: {
      name: "Rexus Warehouse Jakarta",
      address: "Jl. Industri No. 10",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "13920"
    },
    destination: {
      name: "John Doe",
      address: "Jl. Sudirman No. 123",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "12190"
    },
    package: {
      weight: 1.2,
      dimensions: "30x20x10 cm",
      items: 1,
      value: 800000
    },
    events: [
      {
        id: "EVT001",
        timestamp: "2024-08-13 14:30:00",
        status: "delivered",
        location: "Jakarta - Sudirman",
        description: "Package delivered successfully",
        details: "Delivered to recipient. Signed by: John Doe",
        operator: "Budi Santoso"
      },
      {
        id: "EVT002",
        timestamp: "2024-08-13 09:15:00",
        status: "out_for_delivery",
        location: "Jakarta - Hub Tanah Abang",
        description: "Out for delivery",
        details: "Package loaded for delivery. Driver: Budi Santoso",
        operator: "Jakarta Hub"
      },
      {
        id: "EVT003",
        timestamp: "2024-08-12 20:45:00",
        status: "in_transit",
        location: "Jakarta - Hub Tanah Abang",
        description: "Package arrived at destination hub",
        details: "Arrived at Jakarta distribution center",
        operator: "Jakarta Hub"
      },
      {
        id: "EVT004",
        timestamp: "2024-08-11 16:20:00",
        status: "in_transit",
        location: "Jakarta - Warehouse",
        description: "Package dispatched from origin",
        details: "Package collected and dispatched for delivery",
        operator: "Warehouse Team"
      },
      {
        id: "EVT005",
        timestamp: "2024-08-11 10:00:00",
        status: "picked_up",
        location: "Jakarta - Warehouse",
        description: "Package picked up",
        details: "Package collected from Rexus warehouse",
        operator: "Pickup Team"
      },
      {
        id: "EVT006",
        timestamp: "2024-08-10 15:30:00",
        status: "pending",
        location: "Jakarta - Warehouse",
        description: "Shipping label created",
        details: "Order processed and ready for pickup",
        operator: "System"
      }
    ],
    createdAt: "2024-08-10",
    notes: "Customer requested express delivery"
  },
  {
    trackingNumber: "REX987654321",
    orderId: "ORD002",
    orderNumber: "RXS-2024-08-002",
    customerId: "USR002",
    customerName: "Jane Smith",
    customerPhone: "+62823456789",
    customerEmail: "jane.smith@example.com",
    currentStatus: "in_transit",
    estimatedDelivery: "2024-08-12",
    shippingMethod: "Standard Delivery",
    shippingProvider: "REX Express",
    origin: {
      name: "Rexus Warehouse Jakarta",
      address: "Jl. Industri No. 10",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "13920"
    },
    destination: {
      name: "Jane Smith",
      address: "Jl. Asia Afrika No. 456",
      city: "Bandung",
      state: "Jawa Barat",
      postalCode: "40111"
    },
    package: {
      weight: 0.8,
      dimensions: "25x15x8 cm",
      items: 2,
      value: 1020000
    },
    events: [
      {
        id: "EVT007",
        timestamp: "2024-08-11 18:30:00",
        status: "in_transit",
        location: "Bandung - Hub Dago",
        description: "Package arrived at destination city",
        details: "Arrived at Bandung distribution center",
        operator: "Bandung Hub"
      },
      {
        id: "EVT008",
        timestamp: "2024-08-10 22:15:00",
        status: "in_transit",
        location: "Jakarta - Hub Cikampek",
        description: "Package in transit",
        details: "Package sorted and forwarded to Bandung",
        operator: "Transit Hub"
      },
      {
        id: "EVT009",
        timestamp: "2024-08-10 14:20:00",
        status: "picked_up",
        location: "Jakarta - Warehouse",
        description: "Package picked up",
        details: "Package collected from Rexus warehouse",
        operator: "Pickup Team"
      },
      {
        id: "EVT010",
        timestamp: "2024-08-09 16:45:00",
        status: "pending",
        location: "Jakarta - Warehouse",
        description: "Shipping label created",
        details: "Order processed and ready for pickup",
        operator: "System"
      }
    ],
    createdAt: "2024-08-09"
  },
  {
    trackingNumber: "REX555666777",
    orderId: "ORD003",
    orderNumber: "RXS-2024-08-003",
    customerId: "USR003",
    customerName: "Mike Johnson",
    customerPhone: "+62834567890",
    customerEmail: "mike.johnson@example.com",
    currentStatus: "exception",
    estimatedDelivery: "2024-08-11",
    shippingMethod: "Same Day Delivery",
    shippingProvider: "REX Express",
    origin: {
      name: "Rexus Warehouse Jakarta",
      address: "Jl. Industri No. 10",
      city: "Jakarta",
      state: "DKI Jakarta",
      postalCode: "13920"
    },
    destination: {
      name: "Mike Johnson",
      address: "Jl. Basuki Rahmat No. 789",
      city: "Surabaya",
      state: "Jawa Timur",
      postalCode: "60271"
    },
    package: {
      weight: 2.5,
      dimensions: "35x25x15 cm",
      items: 2,
      value: 1079000
    },
    events: [
      {
        id: "EVT011",
        timestamp: "2024-08-10 11:20:00",
        status: "exception",
        location: "Surabaya - Hub Gubeng",
        description: "Delivery attempt failed",
        details: "Customer not available. Will retry tomorrow",
        operator: "Delivery Team"
      },
      {
        id: "EVT012",
        timestamp: "2024-08-10 08:45:00",
        status: "out_for_delivery",
        location: "Surabaya - Hub Gubeng",
        description: "Out for delivery",
        details: "Package loaded for delivery",
        operator: "Surabaya Hub"
      },
      {
        id: "EVT013",
        timestamp: "2024-08-09 19:30:00",
        status: "in_transit",
        location: "Surabaya - Hub Gubeng",
        description: "Package arrived at destination hub",
        details: "Arrived at Surabaya distribution center",
        operator: "Surabaya Hub"
      }
    ],
    createdAt: "2024-08-08",
    notes: "Customer requested gift wrapping"
  }
];

export default function TrackingStatus() {
  const [trackingData, setTrackingData] = useState<ShippingDetail[]>(mockTrackingData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTracking, setSelectedTracking] = useState<ShippingDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const filteredTracking = trackingData.filter(tracking => {
    const matchesSearch = tracking.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tracking.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tracking.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tracking.currentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TrackingStatus) => {
    const variants = {
      pending: "bg-gray-100 text-gray-800",
      picked_up: "bg-blue-100 text-blue-800",
      in_transit: "bg-yellow-100 text-yellow-800",
      out_for_delivery: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      exception: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800"
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      picked_up: <Package className="h-3 w-3 mr-1" />,
      in_transit: <Truck className="h-3 w-3 mr-1" />,
      out_for_delivery: <Navigation className="h-3 w-3 mr-1" />,
      delivered: <CheckCircle className="h-3 w-3 mr-1" />,
      exception: <AlertTriangle className="h-3 w-3 mr-1" />,
      returned: <RefreshCw className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={variants[status]}>
        {icons[status]}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewTracking = (tracking: ShippingDetail) => {
    setSelectedTracking(tracking);
    setIsDetailDialogOpen(true);
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    // You could add a toast notification here
  };

  const trackingStats = {
    total: trackingData.length,
    pending: trackingData.filter(t => t.currentStatus === "pending").length,
    inTransit: trackingData.filter(t => t.currentStatus === "in_transit").length,
    outForDelivery: trackingData.filter(t => t.currentStatus === "out_for_delivery").length,
    delivered: trackingData.filter(t => t.currentStatus === "delivered").length,
    exceptions: trackingData.filter(t => t.currentStatus === "exception").length
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tracking & Delivery Status</h1>
          <p className="text-gray-600 mt-2">Monitor shipments and delivery status</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Tracking
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Tracking List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                  <p className="text-3xl font-bold text-gray-900">{trackingStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-3xl font-bold text-yellow-600">{trackingStats.inTransit}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Truck className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out for Delivery</p>
                  <p className="text-3xl font-bold text-purple-600">{trackingStats.outForDelivery}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Navigation className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-3xl font-bold text-green-600">{trackingStats.delivered}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Exceptions</p>
                  <p className="text-3xl font-bold text-red-600">{trackingStats.exceptions}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-600">{trackingStats.pending}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Deliveries</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {trackingData
                  .filter(t => t.currentStatus === "delivered")
                  .slice(0, 5)
                  .map((tracking) => (
                  <div key={tracking.trackingNumber} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{tracking.trackingNumber}</div>
                      <div className="text-sm text-gray-500">{tracking.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Delivered</div>
                      <div className="text-xs text-gray-500">{tracking.actualDelivery && formatDate(tracking.actualDelivery)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Attention Required</h3>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notify
                </Button>
              </div>
              <div className="space-y-4">
                {trackingData
                  .filter(t => t.currentStatus === "exception")
                  .map((tracking) => (
                  <div key={tracking.trackingNumber} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{tracking.trackingNumber}</div>
                      <div className="text-sm text-gray-500">{tracking.customerName}</div>
                      <div className="text-xs text-red-600">
                        {tracking.events[0]?.description}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tracking number, order, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="exception">Exception</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Tracking Table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Shipment Tracking ({filteredTracking.length})</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredTracking.length} of {trackingData.length} shipments
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origin → Destination</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTracking.map((tracking) => (
                      <TableRow key={tracking.trackingNumber} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-blue-600">{tracking.trackingNumber}</div>
                              <div className="text-sm text-gray-500">{tracking.shippingProvider}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTrackingNumber(tracking.trackingNumber)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tracking.orderNumber}</div>
                            <div className="text-sm text-gray-500">{tracking.orderId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tracking.customerName}</div>
                            <div className="text-sm text-gray-500">{tracking.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tracking.currentStatus)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>{tracking.origin.city}</span>
                            </div>
                            <div className="text-gray-400">↓</div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>{tracking.destination.city}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {tracking.actualDelivery ? (
                              <div className="text-green-600 font-medium">
                                {formatDate(tracking.actualDelivery)}
                              </div>
                            ) : (
                              <div className="text-gray-600">
                                {formatDate(tracking.estimatedDelivery)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(tracking.events[0]?.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTracking(tracking)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                            >
                              <a href={`#track/${tracking.trackingNumber}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tracking Analytics</h3>
            <p className="text-gray-600">View delivery performance and analytics</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Tracking Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tracking Details</DialogTitle>
          </DialogHeader>
          {selectedTracking && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Shipment Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600">{selectedTracking.trackingNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTrackingNumber(selectedTracking.trackingNumber)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">{selectedTracking.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedTracking.currentStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Method:</span>
                      <span className="font-medium">{selectedTracking.shippingMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{selectedTracking.shippingProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Delivery:</span>
                      <span className="font-medium">{formatDate(selectedTracking.estimatedDelivery)}</span>
                    </div>
                    {selectedTracking.actualDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivered:</span>
                        <span className="font-medium text-green-600">{formatDate(selectedTracking.actualDelivery)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedTracking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedTracking.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedTracking.customerEmail}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Package Details */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Package Details
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Weight:</span>
                    <div className="font-medium">{selectedTracking.package.weight} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Dimensions:</span>
                    <div className="font-medium">{selectedTracking.package.dimensions}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Items:</span>
                    <div className="font-medium">{selectedTracking.package.items}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Value:</span>
                    <div className="font-medium">{formatCurrency(selectedTracking.package.value)}</div>
                  </div>
                </div>
              </Card>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Origin
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{selectedTracking.origin.name}</div>
                    <div>{selectedTracking.origin.address}</div>
                    <div>{selectedTracking.origin.city}, {selectedTracking.origin.state}</div>
                    <div>{selectedTracking.origin.postalCode}</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Destination
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{selectedTracking.destination.name}</div>
                    <div>{selectedTracking.destination.address}</div>
                    <div>{selectedTracking.destination.city}, {selectedTracking.destination.state}</div>
                    <div>{selectedTracking.destination.postalCode}</div>
                  </div>
                </Card>
              </div>

              {/* Tracking History */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Tracking History
                </h3>
                <div className="space-y-4">
                  {selectedTracking.events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {event.status === 'delivered' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {event.status === 'out_for_delivery' && <Navigation className="h-4 w-4 text-purple-600" />}
                          {event.status === 'in_transit' && <Truck className="h-4 w-4 text-yellow-600" />}
                          {event.status === 'picked_up' && <Package className="h-4 w-4 text-blue-600" />}
                          {event.status === 'pending' && <Clock className="h-4 w-4 text-gray-600" />}
                          {event.status === 'exception' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        </div>
                        {index < selectedTracking.events.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">{event.description}</div>
                          <div className="text-sm text-gray-500">{formatDateTime(event.timestamp)}</div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {event.location}
                        </div>
                        {event.details && (
                          <div className="text-sm text-gray-600">{event.details}</div>
                        )}
                        {event.operator && (
                          <div className="text-xs text-gray-500 mt-1">Operator: {event.operator}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Notes */}
              {selectedTracking.notes && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </h3>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    {selectedTracking.notes}
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
