import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  QrCode,
  Package,
  Shield,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Send,
  Truck,
  Settings,
  PrinterIcon,
  RefreshCw,
  History,
  CheckSquare,
  X,
  Check,
  ArrowRight,
  Info,
  Archive,
  BarChart3
} from "lucide-react";

type WarrantyStatus = "active" | "expired" | "claimed" | "processing" | "repaired" | "replaced" | "denied";
type ClaimStatus = "pending" | "validated" | "in_repair" | "repaired" | "shipped" | "completed" | "rejected";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  warrantyPeriod: number; // months
  price: number;
};

type WarrantyBarcode = {
  id: string;
  productId: string;
  barcodeNumber: string;
  qrCodeData: string;
  purchaseDate?: string;
  customerId?: string;
  status: WarrantyStatus;
  expiryDate?: string;
  isUsed: boolean;
  generatedAt: string;
  printedAt?: string;
  activatedAt?: string;
};

type WarrantyClaim = {
  id: string;
  barcodeId: string;
  claimNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  issueDescription: string;
  issueCategory: string;
  purchaseDate: string;
  claimDate: string;
  status: ClaimStatus;
  validatedBy?: string;
  validatedAt?: string;
  repairNotes?: string;
  estimatedRepairTime?: number; // days
  actualRepairTime?: number; // days
  repairCost?: number;
  replacementProductId?: string;
  shippingTrackingNumber?: string;
  completedAt?: string;
  rejectionReason?: string;
  photos: string[];
  attachments: string[];
};

type RepairTicket = {
  id: string;
  claimId: string;
  technicianId: string;
  technicianName: string;
  startDate: string;
  endDate?: string;
  status: "assigned" | "in_progress" | "completed" | "on_hold";
  repairSteps: RepairStep[];
  partsCost: number;
  laborCost: number;
  notes: string;
};

type RepairStep = {
  id: string;
  description: string;
  status: "pending" | "completed";
  completedAt?: string;
  notes?: string;
};

// Mock data
const mockProducts: Product[] = [
  { id: "prod1", name: "Rexus Gaming Mouse RX-110", sku: "RX-110", category: "Mouse", warrantyPeriod: 12, price: 150000 },
  { id: "prod2", name: "Rexus Gaming Keyboard KX-200", sku: "KX-200", category: "Keyboard", warrantyPeriod: 24, price: 800000 },
  { id: "prod3", name: "Rexus Gaming Headset HX-300", sku: "HX-300", category: "Headset", warrantyPeriod: 18, price: 500000 },
  { id: "prod4", name: "Rexus Gaming Mousepad MP-400", sku: "MP-400", category: "Mousepad", warrantyPeriod: 6, price: 75000 },
];

const mockBarcodes: WarrantyBarcode[] = [
  {
    id: "bc001",
    productId: "prod1",
    barcodeNumber: "REX2024080100001",
    qrCodeData: "https://warranty.rexus.com/claim/REX2024080100001",
    purchaseDate: "2024-07-15",
    customerId: "cust001",
    status: "active",
    expiryDate: "2025-07-15",
    isUsed: true,
    generatedAt: "2024-07-10",
    activatedAt: "2024-07-15"
  },
  {
    id: "bc002",
    productId: "prod2",
    barcodeNumber: "REX2024080100002",
    qrCodeData: "https://warranty.rexus.com/claim/REX2024080100002",
    status: "active",
    isUsed: false,
    generatedAt: "2024-08-01"
  },
  {
    id: "bc003",
    productId: "prod1",
    barcodeNumber: "REX2024080100003",
    qrCodeData: "https://warranty.rexus.com/claim/REX2024080100003",
    purchaseDate: "2024-06-20",
    customerId: "cust002",
    status: "claimed",
    expiryDate: "2025-06-20",
    isUsed: true,
    generatedAt: "2024-06-15",
    activatedAt: "2024-06-20"
  }
];

const mockClaims: WarrantyClaim[] = [
  {
    id: "claim001",
    barcodeId: "bc003",
    claimNumber: "WC-2024-08-001",
    customerId: "cust002",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    customerPhone: "+62812345678",
    productId: "prod1",
    productName: "Rexus Gaming Mouse RX-110",
    issueDescription: "Mouse left click not working properly, sometimes double clicks",
    issueCategory: "Hardware Malfunction",
    purchaseDate: "2024-06-20",
    claimDate: "2024-08-10",
    status: "pending",
    photos: ["photo1.jpg", "photo2.jpg"],
    attachments: ["receipt.pdf"]
  },
  {
    id: "claim002",
    barcodeId: "bc001",
    claimNumber: "WC-2024-08-002",
    customerId: "cust001",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    customerPhone: "+62823456789",
    productId: "prod1",
    productName: "Rexus Gaming Mouse RX-110",
    issueDescription: "Mouse sensor not tracking correctly on mousepad",
    issueCategory: "Performance Issue",
    purchaseDate: "2024-07-15",
    claimDate: "2024-08-09",
    status: "in_repair",
    validatedBy: "admin001",
    validatedAt: "2024-08-09",
    repairNotes: "Sensor cleaning and calibration required",
    estimatedRepairTime: 3,
    photos: ["sensor_issue.jpg"],
    attachments: ["purchase_receipt.pdf"]
  },
  {
    id: "claim003",
    barcodeId: "bc004",
    claimNumber: "WC-2024-08-003",
    customerId: "cust003",
    customerName: "Mike Johnson",
    customerEmail: "mike.johnson@example.com",
    customerPhone: "+62834567890",
    productId: "prod2",
    productName: "Rexus Gaming Keyboard KX-200",
    issueDescription: "Several keys stopped working after liquid spill",
    issueCategory: "Physical Damage",
    purchaseDate: "2024-05-10",
    claimDate: "2024-08-08",
    status: "rejected",
    validatedBy: "admin002",
    validatedAt: "2024-08-08",
    rejectionReason: "Physical damage due to liquid spill is not covered under warranty",
    photos: ["liquid_damage.jpg"],
    attachments: []
  }
];

export default function WarrantyProgram() {
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [barcodes, setBarcodes] = useState<WarrantyBarcode[]>(mockBarcodes);
  const [claims, setClaims] = useState<WarrantyClaim[]>(mockClaims);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [bulkQuantity, setBulkQuantity] = useState<number>(1);
  const [isGeneratingBarcodes, setIsGeneratingBarcodes] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);

  // Form states
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: "",
    shippingProvider: "",
    estimatedDelivery: "",
    notes: ""
  });

  const generateBarcodes = async () => {
    if (!selectedProduct || bulkQuantity < 1) return;

    setIsGeneratingBarcodes(true);
    
    // Simulate barcode generation
    setTimeout(() => {
      const newBarcodes: WarrantyBarcode[] = [];
      for (let i = 0; i < bulkQuantity; i++) {
        const barcodeNumber = `REX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(barcodes.length + i + 1).padStart(5, '0')}`;
        const newBarcode: WarrantyBarcode = {
          id: `bc${Date.now()}_${i}`,
          productId: selectedProduct,
          barcodeNumber,
          qrCodeData: `https://warranty.rexus.com/claim/${barcodeNumber}`,
          status: "active",
          isUsed: false,
          generatedAt: new Date().toISOString().slice(0, 10)
        };
        newBarcodes.push(newBarcode);
      }
      
      setBarcodes(prev => [...prev, ...newBarcodes]);
      setIsGeneratingBarcodes(false);
      setBulkQuantity(1);
      setSelectedProduct("");
    }, 2000);
  };

  const validateClaim = (claimId: string, isValid: boolean, notes?: string) => {
    setClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { 
            ...claim, 
            status: isValid ? "validated" : "rejected",
            validatedBy: "admin001",
            validatedAt: new Date().toISOString().slice(0, 10),
            rejectionReason: !isValid ? notes : undefined
          }
        : claim
    ));
  };

  const updateClaimStatus = (claimId: string, newStatus: ClaimStatus, notes?: string) => {
    setClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { 
            ...claim, 
            status: newStatus,
            repairNotes: notes || claim.repairNotes,
            ...(newStatus === "completed" && { completedAt: new Date().toISOString().slice(0, 10) })
          }
        : claim
    ));
  };

  const shipProduct = () => {
    if (!selectedClaim) return;

    setClaims(prev => prev.map(claim => 
      claim.id === selectedClaim.id 
        ? { 
            ...claim, 
            status: "shipped",
            shippingTrackingNumber: shippingForm.trackingNumber
          }
        : claim
    ));

    setIsShippingDialogOpen(false);
    setShippingForm({
      trackingNumber: "",
      shippingProvider: "",
      estimatedDelivery: "",
      notes: ""
    });
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      validated: "bg-blue-100 text-blue-800",
      in_repair: "bg-purple-100 text-purple-800",
      repaired: "bg-green-100 text-green-800",
      shipped: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      validated: <CheckCircle className="h-3 w-3 mr-1" />,
      in_repair: <Wrench className="h-3 w-3 mr-1" />,
      repaired: <CheckSquare className="h-3 w-3 mr-1" />,
      shipped: <Truck className="h-3 w-3 mr-1" />,
      completed: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalBarcodes: barcodes.length,
    activeBarcodes: barcodes.filter(b => b.status === "active" && !b.isUsed).length,
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === "pending").length,
    inRepairClaims: claims.filter(c => c.status === "in_repair").length,
    completedClaims: claims.filter(c => c.status === "completed").length
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Program</h1>
          <p className="text-gray-600 mt-2">Manage product warranties and claims</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <PrinterIcon className="h-4 w-4" />
            Print Barcodes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="barcodes">Barcode Generator</TabsTrigger>
          <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Barcodes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBarcodes}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Barcodes</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeBarcodes}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingClaims}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Repair</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.inRepairClaims}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedClaims}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Claims</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.totalClaims}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Claims</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {claims.slice(0, 5).map((claim) => (
                  <div key={claim.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{claim.claimNumber}</div>
                      <div className="text-sm text-gray-500">{claim.customerName} • {claim.productName}</div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(claim.status)}
                      <div className="text-xs text-gray-500 mt-1">{formatDate(claim.claimDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Product Warranty Status</h3>
                <Button variant="outline" size="sm">Generate Barcodes</Button>
              </div>
              <div className="space-y-4">
                {products.map((product) => {
                  const productBarcodes = barcodes.filter(b => b.productId === product.id);
                  const activeBarcodes = productBarcodes.filter(b => b.status === "active" && !b.isUsed);
                  
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.warrantyPeriod} months warranty • {productBarcodes.length} barcodes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{activeBarcodes.length} Available</div>
                        <div className="text-xs text-gray-500">{productBarcodes.length} Total</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="barcodes" className="space-y-6">
          {/* Barcode Generator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Generate Warranty Barcodes</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product">Select Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="1000"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Enter quantity"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Generate up to 1000 unique barcodes at once
                  </p>
                </div>

                <Button 
                  onClick={generateBarcodes}
                  disabled={!selectedProduct || bulkQuantity < 1 || isGeneratingBarcodes}
                  className="w-full flex items-center gap-2"
                >
                  {isGeneratingBarcodes ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {isGeneratingBarcodes ? "Generating..." : "Generate Barcodes"}
                </Button>
              </div>

              {selectedProduct && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
                  <div className="text-sm text-blue-800">
                    <p>Product: {products.find(p => p.id === selectedProduct)?.name}</p>
                    <p>Warranty: {products.find(p => p.id === selectedProduct)?.warrantyPeriod} months</p>
                    <p>Quantity: {bulkQuantity} barcode(s)</p>
                    <p>Format: REX{new Date().toISOString().slice(0, 10).replace(/-/g, '')}XXXXX</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Generated Barcodes</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {barcodes.slice(0, 10).map((barcode) => {
                  const product = products.find(p => p.id === barcode.productId);
                  return (
                    <div key={barcode.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{barcode.barcodeNumber}</div>
                        <div className="text-xs text-gray-500">{product?.name}</div>
                        <div className="text-xs text-gray-400">Generated: {formatDate(barcode.generatedAt)}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={barcode.isUsed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {barcode.isUsed ? "Used" : "Available"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Generated: {barcodes.length}</span>
                  <span>Available: {barcodes.filter(b => !b.isUsed).length}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          {/* Claims Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Warranty Claims Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="in_repair">In Repair</SelectItem>
                    <SelectItem value="repaired">Repaired</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Claim Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => {
                    const product = products.find(p => p.id === claim.productId);
                    return (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <div className="font-medium">{claim.claimNumber}</div>
                          <div className="text-sm text-gray-500">
                            {claim.barcodeId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.customerName}</div>
                            <div className="text-sm text-gray-500">{claim.customerEmail}</div>
                            <div className="text-sm text-gray-500">{claim.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.productName}</div>
                            <div className="text-sm text-gray-500">
                              Purchased: {formatDate(claim.purchaseDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.issueCategory}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {claim.issueDescription}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell>{formatDate(claim.claimDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setIsClaimDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {claim.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => validateClaim(claim.id, true)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => validateClaim(claim.id, false, "Invalid warranty claim")}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Warranty Reports</h3>
            <p className="text-gray-600">View warranty analytics and reports</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Claim Details Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Warranty Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Header */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Claim Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim Number:</span>
                      <span className="font-medium">{selectedClaim.claimNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedClaim.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim Date:</span>
                      <span className="font-medium">{formatDate(selectedClaim.claimDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Category:</span>
                      <span className="font-medium">{selectedClaim.issueCategory}</span>
                    </div>
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
                      <span className="font-medium">{selectedClaim.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedClaim.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedClaim.customerPhone}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Product & Issue Details */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product & Issue Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Product:</Label>
                    <div className="font-medium">{selectedClaim.productName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Purchase Date:</Label>
                    <div className="font-medium">{formatDate(selectedClaim.purchaseDate)}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-gray-600">Issue Description:</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedClaim.issueDescription}
                  </div>
                </div>
              </Card>

              {/* Status Management */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status Management
                </h3>
                <div className="space-y-4">
                  {selectedClaim.status === "pending" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => validateClaim(selectedClaim.id, true)}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Validate Claim
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => validateClaim(selectedClaim.id, false, "Invalid warranty claim")}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject Claim
                      </Button>
                    </div>
                  )}

                  {selectedClaim.status === "validated" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => updateClaimStatus(selectedClaim.id, "in_repair")}
                        className="flex items-center gap-2"
                      >
                        <Wrench className="h-4 w-4" />
                        Start Repair
                      </Button>
                    </div>
                  )}

                  {selectedClaim.status === "in_repair" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => updateClaimStatus(selectedClaim.id, "repaired")}
                        className="flex items-center gap-2"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Mark as Repaired
                      </Button>
                    </div>
                  )}

                  {selectedClaim.status === "repaired" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setIsShippingDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Ship Back to Customer
                      </Button>
                    </div>
                  )}

                  {selectedClaim.status === "shipped" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => updateClaimStatus(selectedClaim.id, "completed")}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </div>

                {/* Repair Notes */}
                {(selectedClaim.status === "in_repair" || selectedClaim.status === "repaired") && (
                  <div className="mt-4">
                    <Label htmlFor="repairNotes">Repair Notes</Label>
                    <Textarea
                      id="repairNotes"
                      placeholder="Add repair notes..."
                      defaultValue={selectedClaim.repairNotes}
                      className="mt-1"
                    />
                  </div>
                )}
              </Card>

              {/* Shipping Info */}
              {selectedClaim.shippingTrackingNumber && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-medium">{selectedClaim.shippingTrackingNumber}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ship Product Back</DialogTitle>
            <DialogDescription>
              Enter shipping details to send the repaired product back to customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={shippingForm.trackingNumber}
                onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <Label htmlFor="shippingProvider">Shipping Provider</Label>
              <Select 
                value={shippingForm.shippingProvider} 
                onValueChange={(value) => setShippingForm(prev => ({ ...prev, shippingProvider: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jne">JNE</SelectItem>
                  <SelectItem value="pos">Pos Indonesia</SelectItem>
                  <SelectItem value="tiki">TIKI</SelectItem>
                  <SelectItem value="sicepat">SiCepat</SelectItem>
                  <SelectItem value="jnt">J&T Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={shippingForm.estimatedDelivery}
                onChange={(e) => setShippingForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="shippingNotes">Notes (Optional)</Label>
              <Textarea
                id="shippingNotes"
                value={shippingForm.notes}
                onChange={(e) => setShippingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional shipping notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={shipProduct}>
              Ship Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
