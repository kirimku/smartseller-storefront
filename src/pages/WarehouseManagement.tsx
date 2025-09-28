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
  Warehouse, 
  Package, 
  TruckIcon as Truck, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Search,
  Calendar,
  Plus,
  ScanLine,
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  MapPin,
  Clock,
  Target,
  FileText,
  Archive,
  Boxes,
  Move,
  RefreshCw,
  Zap
} from 'lucide-react';

interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  type: 'main' | 'distribution' | 'returns';
  capacity: number;
  currentStock: number;
  manager: string;
  status: 'active' | 'maintenance' | 'inactive';
}

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  location: string; // Zone-Aisle-Shelf format: A-01-03
  quantity: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

interface InboundShipment {
  id: string;
  poNumber: string;
  supplier: string;
  warehouseId: string;
  warehouseName: string;
  expectedDate: string;
  receivedDate?: string;
  status: 'scheduled' | 'in_transit' | 'arrived' | 'receiving' | 'completed' | 'cancelled';
  items: InboundItem[];
  totalValue: number;
  notes?: string;
  createdBy: string;
  receivedBy?: string;
}

interface InboundItem {
  sku: string;
  productName: string;
  expectedQuantity: number;
  receivedQuantity?: number;
  unitCost: number;
  location?: string;
  condition: 'new' | 'damaged' | 'returned';
}

interface OutboundShipment {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  warehouseId: string;
  warehouseName: string;
  requestedDate: string;
  shippedDate?: string;
  status: 'pending' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  items: OutboundItem[];
  totalValue: number;
  shippingMethod: string;
  trackingNumber?: string;
  pickedBy?: string;
  packedBy?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface OutboundItem {
  sku: string;
  productName: string;
  requestedQuantity: number;
  pickedQuantity?: number;
  location: string;
  unitPrice: number;
  allocated: boolean;
}

const WarehouseManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreatingInbound, setIsCreatingInbound] = useState(false);
  const [isCreatingOutbound, setIsCreatingOutbound] = useState(false);

  // Mock data
  const warehouses: WarehouseLocation[] = [
    {
      id: 'WH001',
      name: 'Main Distribution Center',
      address: '123 Industrial Blvd, Jakarta',
      type: 'main',
      capacity: 50000,
      currentStock: 42350,
      manager: 'John Smith',
      status: 'active'
    },
    {
      id: 'WH002',
      name: 'North Regional Hub',
      address: '456 Commerce St, Surabaya',
      type: 'distribution',
      capacity: 25000,
      currentStock: 18200,
      manager: 'Sarah Johnson',
      status: 'active'
    },
    {
      id: 'WH003',
      name: 'Returns Processing Center',
      address: '789 Return Ave, Bandung',
      type: 'returns',
      capacity: 10000,
      currentStock: 3400,
      manager: 'Mike Davis',
      status: 'active'
    }
  ];

  const inventory: InventoryItem[] = [
    {
      id: 'INV001',
      sku: 'RX-MX7-001',
      productName: 'Rexus Gaming Headset MX-7',
      category: 'Gaming Headsets',
      warehouseId: 'WH001',
      warehouseName: 'Main Distribution Center',
      location: 'A-01-03',
      quantity: 250,
      reserved: 45,
      available: 205,
      reorderPoint: 50,
      maxStock: 500,
      unitCost: 149.99,
      lastUpdated: '2024-08-10',
      status: 'in_stock'
    },
    {
      id: 'INV002',
      sku: 'RX-K9-002',
      productName: 'Rexus Gaming Keyboard K-9',
      category: 'Gaming Keyboards',
      warehouseId: 'WH001',
      warehouseName: 'Main Distribution Center',
      location: 'B-02-01',
      quantity: 35,
      reserved: 15,
      available: 20,
      reorderPoint: 40,
      maxStock: 300,
      unitCost: 99.99,
      lastUpdated: '2024-08-09',
      status: 'low_stock'
    },
    {
      id: 'INV003',
      sku: 'RX-M15-003',
      productName: 'Rexus Gaming Mouse M-15',
      category: 'Gaming Mice',
      warehouseId: 'WH002',
      warehouseName: 'North Regional Hub',
      location: 'C-01-02',
      quantity: 0,
      reserved: 0,
      available: 0,
      reorderPoint: 25,
      maxStock: 200,
      unitCost: 49.99,
      lastUpdated: '2024-08-08',
      status: 'out_of_stock'
    }
  ];

  const inboundShipments: InboundShipment[] = [
    {
      id: 'IB001',
      poNumber: 'PO-2024-001',
      supplier: 'Rexus Manufacturing',
      warehouseId: 'WH001',
      warehouseName: 'Main Distribution Center',
      expectedDate: '2024-08-12',
      status: 'in_transit',
      items: [
        {
          sku: 'RX-MX7-001',
          productName: 'Rexus Gaming Headset MX-7',
          expectedQuantity: 100,
          unitCost: 149.99,
          condition: 'new'
        },
        {
          sku: 'RX-K9-002',
          productName: 'Rexus Gaming Keyboard K-9',
          expectedQuantity: 150,
          unitCost: 99.99,
          condition: 'new'
        }
      ],
      totalValue: 29998.50,
      createdBy: 'Admin User'
    },
    {
      id: 'IB002',
      poNumber: 'PO-2024-002',
      supplier: 'Tech Components Ltd',
      warehouseId: 'WH001',
      warehouseName: 'Main Distribution Center',
      expectedDate: '2024-08-11',
      receivedDate: '2024-08-10',
      status: 'receiving',
      items: [
        {
          sku: 'RX-M15-003',
          productName: 'Rexus Gaming Mouse M-15',
          expectedQuantity: 200,
          receivedQuantity: 195,
          unitCost: 49.99,
          location: 'C-01-02',
          condition: 'new'
        }
      ],
      totalValue: 9998.00,
      createdBy: 'Admin User',
      receivedBy: 'Warehouse Staff'
    }
  ];

  const outboundShipments: OutboundShipment[] = [
    {
      id: 'OB001',
      orderNumber: 'ORD-2024-001',
      customer: 'John Doe',
      customerEmail: 'john@email.com',
      warehouseId: 'WH001',
      warehouseName: 'Main Distribution Center',
      requestedDate: '2024-08-10',
      status: 'picking',
      items: [
        {
          sku: 'RX-MX7-001',
          productName: 'Rexus Gaming Headset MX-7',
          requestedQuantity: 2,
          location: 'A-01-03',
          unitPrice: 299.99,
          allocated: true
        }
      ],
      totalValue: 599.98,
      shippingMethod: 'Express',
      priority: 'high',
      pickedBy: 'Warehouse Staff'
    },
    {
      id: 'OB002',
      orderNumber: 'ORD-2024-002',
      customer: 'Sarah Smith',
      customerEmail: 'sarah@email.com',
      warehouseId: 'WH002',
      warehouseName: 'North Regional Hub',
      requestedDate: '2024-08-09',
      shippedDate: '2024-08-10',
      status: 'shipped',
      items: [
        {
          sku: 'RX-K9-002',
          productName: 'Rexus Gaming Keyboard K-9',
          requestedQuantity: 1,
          pickedQuantity: 1,
          location: 'B-02-01',
          unitPrice: 199.99,
          allocated: true
        }
      ],
      totalValue: 199.99,
      shippingMethod: 'Standard',
      trackingNumber: 'TRK123456789',
      priority: 'normal',
      pickedBy: 'Warehouse Staff',
      packedBy: 'Packing Team'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800',
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      overstock: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      arrived: 'bg-green-100 text-green-800',
      receiving: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800',
      picking: 'bg-yellow-100 text-yellow-800',
      packed: 'bg-purple-100 text-purple-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-emerald-100 text-emerald-800'
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  const getWarehouseTypeIcon = (type: string) => {
    const icons = {
      main: <Warehouse className="h-4 w-4" />,
      distribution: <Truck className="h-4 w-4" />,
      returns: <RefreshCw className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons];
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-gray-600">Manage inventory, inbound and outbound operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline">
            <ScanLine className="mr-2 h-4 w-4" />
            Barcode Scanner
          </Button>
          <Dialog open={isCreatingInbound} onOpenChange={setIsCreatingInbound}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                New Inbound
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Inbound Shipment</DialogTitle>
                <DialogDescription>
                  Register a new incoming shipment to the warehouse
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input id="poNumber" placeholder="PO-2024-003" />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input id="supplier" placeholder="Supplier name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(warehouse => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedDate">Expected Date</Label>
                    <Input id="expectedDate" type="date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional notes..." />
                </div>
                <Button className="w-full">Create Inbound Shipment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="inbound">Inbound</TabsTrigger>
          <TabsTrigger value="outbound">Outbound</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouses.length}</div>
                <p className="text-xs text-muted-foreground">All operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+23 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inbound Shipments</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 arriving today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outbound Orders</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87</div>
                <p className="text-xs text-muted-foreground">+15% from yesterday</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Capacity</CardTitle>
                <CardDescription>Current utilization across all warehouses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warehouses.map((warehouse) => {
                    const utilization = (warehouse.currentStock / warehouse.capacity) * 100;
                    return (
                      <div key={warehouse.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {getWarehouseTypeIcon(warehouse.type)}
                            <span className="font-medium">{warehouse.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilization > 90 ? 'bg-red-500' : 
                              utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventory.filter(item => item.status !== 'in_stock').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">{item.sku} • {item.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} units</p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inbound Activity</CardTitle>
                <CardDescription>Latest incoming shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inboundShipments.slice(0, 5).map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{shipment.poNumber}</p>
                        <p className="text-sm text-gray-500">
                          {shipment.supplier} • {shipment.expectedDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${shipment.totalValue}</p>
                        {getStatusBadge(shipment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Outbound Activity</CardTitle>
                <CardDescription>Latest outgoing shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outboundShipments.slice(0, 5).map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{shipment.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {shipment.customer} • {shipment.requestedDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${shipment.totalValue}</p>
                        {getStatusBadge(shipment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.warehouseName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.location}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-yellow-600">{item.reserved}</TableCell>
                    <TableCell className="text-green-600">{item.available}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.lastUpdated}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Move className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="inbound" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inbound shipments..."
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inboundShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Badge variant="outline">{shipment.poNumber}</Badge>
                    </TableCell>
                    <TableCell>{shipment.supplier}</TableCell>
                    <TableCell>{shipment.warehouseName}</TableCell>
                    <TableCell>{shipment.expectedDate}</TableCell>
                    <TableCell>{shipment.items.length} items</TableCell>
                    <TableCell>${shipment.totalValue}</TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {shipment.status === 'arrived' && (
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {shipment.status === 'scheduled' && (
                          <Button size="sm" variant="outline">
                            <XCircle className="h-4 w-4" />
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

        <TabsContent value="outbound" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search outbound shipments..."
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
                  <SelectItem value="picking">Picking</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreatingOutbound} onOpenChange={setIsCreatingOutbound}>
              <DialogTrigger asChild>
                <Button>
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  New Outbound
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Outbound Shipment</DialogTitle>
                  <DialogDescription>
                    Create a new outbound shipment order
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <Input id="orderNumber" placeholder="ORD-2024-003" />
                    </div>
                    <div>
                      <Label htmlFor="customer">Customer</Label>
                      <Input id="customer" placeholder="Customer name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="outWarehouse">Warehouse</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shippingMethod">Shipping Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="overnight">Overnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Create Outbound Shipment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outboundShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Badge variant="outline">{shipment.orderNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.customer}</p>
                        <p className="text-sm text-gray-500">{shipment.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{shipment.warehouseName}</TableCell>
                    <TableCell>{shipment.items.length} items</TableCell>
                    <TableCell>${shipment.totalValue}</TableCell>
                    <TableCell>{getPriorityBadge(shipment.priority)}</TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {shipment.status === 'pending' && (
                          <Button size="sm">
                            <Target className="h-4 w-4" />
                          </Button>
                        )}
                        {shipment.status === 'picking' && (
                          <Button size="sm">
                            <Boxes className="h-4 w-4" />
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

        <TabsContent value="locations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getWarehouseTypeIcon(warehouse.type)}
                    <span>{warehouse.name}</span>
                  </CardTitle>
                  <CardDescription>{warehouse.address}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Type</span>
                    <Badge className="capitalize">{warehouse.type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status</span>
                    {getStatusBadge(warehouse.status)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Manager</span>
                    <span className="font-medium">{warehouse.manager}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Capacity</span>
                      <span className="font-medium">
                        {((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(warehouse.currentStock / warehouse.capacity) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseManagement;
