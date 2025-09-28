import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Header } from "@/components/common/Header";
import { 
  QrCode, 
  Search, 
  Calendar, 
  Package, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Upload,
  Truck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type WarrantyProduct = {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: "active" | "expired" | "claimed";
  category: string;
  image: string;
};

// Mock warranty data
const mockWarrantyData: Record<string, WarrantyProduct> = {
  "WR001234": {
    id: "WR001234",
    name: "Gaming Mechanical Keyboard",
    model: "REXUS MX5",
    serialNumber: "RX5K2024001234",
    purchaseDate: "2024-01-15",
    warrantyExpiry: "2026-01-15",
    status: "active",
    category: "Keyboard",
    image: "/placeholder.svg"
  },
  "WR005678": {
    id: "WR005678", 
    name: "Gaming Mouse",
    model: "REXUS GM7",
    serialNumber: "RX7M2024005678",
    purchaseDate: "2023-06-10",
    warrantyExpiry: "2025-06-10",
    status: "active",
    category: "Mouse",
    image: "/placeholder.svg"
  }
};

// Logistics services options
const logisticServices = [
  { value: "jne", label: "JNE Express", description: "2-3 business days" },
  { value: "jnt", label: "J&T Express", description: "1-2 business days" },
  { value: "sicepat", label: "SiCepat", description: "2-4 business days" },
  { value: "anteraja", label: "AnterAja", description: "2-3 business days" },
  { value: "pos", label: "Pos Indonesia", description: "3-5 business days" },
  { value: "pickup", label: "Self Pickup", description: "Visit service center" }
];

// Mock warranty history for the user
const mockWarrantyHistory: WarrantyProduct[] = [
  {
    id: "WR001234",
    name: "Gaming Mechanical Keyboard",
    model: "REXUS MX5",
    serialNumber: "RX5K2024001234",
    purchaseDate: "2024-01-15",
    warrantyExpiry: "2026-01-15",
    status: "active",
    category: "Keyboard",
    image: "/placeholder.svg"
  },
  {
    id: "WR005678", 
    name: "Gaming Mouse",
    model: "REXUS GM7",
    serialNumber: "RX7M2024005678",
    purchaseDate: "2023-06-10",
    warrantyExpiry: "2025-06-10",
    status: "active",
    category: "Mouse",
    image: "/placeholder.svg"
  },
  {
    id: "WR009012",
    name: "Gaming Headset",
    model: "REXUS H3",
    serialNumber: "RX3H2023009012",
    purchaseDate: "2023-03-20",
    warrantyExpiry: "2024-03-20",
    status: "expired",
    category: "Headset",
    image: "/placeholder.svg"
  },
  {
    id: "WR003456",
    name: "Gaming Mousepad",
    model: "REXUS P1",
    serialNumber: "RX1P2024003456",
    purchaseDate: "2024-05-10",
    warrantyExpiry: "2025-05-10",
    status: "claimed",
    category: "Mousepad",
    image: "/placeholder.svg"
  }
];

type WarrantyStep = "lookup" | "details" | "claim-form" | "submitted" | "status-detail";

export default function Warranty() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WarrantyStep>("lookup");
  const [warrantyId, setWarrantyId] = useState("");
  const [product, setProduct] = useState<WarrantyProduct | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<WarrantyProduct | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

  // Form state for warranty claim
  const [claimForm, setClaimForm] = useState({
    issueDescription: "",
    customerName: "",
    email: "",
    phone: "",
    address: "",
    invoiceFile: null as File | null,
    logisticService: ""
  });

  const [activeTab, setActiveTab] = useState("home");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "rewards":
        // Navigate to rewards page when implemented
        break;
      case "shop":
        // Navigate to shop page when implemented
        break;
      case "profile":
        // Navigate to profile page when implemented
        break;
    }
  };

  const handleLookup = () => {
    setError("");
    if (!warrantyId.trim()) {
      setError("Please enter a warranty ID");
      return;
    }

    const foundProduct = mockWarrantyData[warrantyId.toUpperCase()];
    if (foundProduct) {
      setProduct(foundProduct);
      setCurrentStep("details");
    } else {
      setError("Warranty ID not found. Please check and try again.");
    }
  };

  const handleQRScan = () => {
    setIsScanning(true);
    // Simulate QR scan - in real app, would use camera
    setTimeout(() => {
      const sampleId = "WR001234";
      setWarrantyId(sampleId);
      setIsScanning(false);
      const foundProduct = mockWarrantyData[sampleId];
      if (foundProduct) {
        setProduct(foundProduct);
        setCurrentStep("details");
      }
    }, 2000);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep("submitted");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClaimForm(prev => ({ ...prev, invoiceFile: file }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "claimed":
        return <Badge variant="secondary">Claimed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderLookupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Warranty Lookup</h1>
        <p className="text-muted-foreground">
          Enter your warranty ID or scan the QR code on your product
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="warranty-id">Warranty ID</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="warranty-id"
                placeholder="Enter warranty ID (e.g., WR001234)"
                value={warrantyId}
                onChange={(e) => setWarrantyId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLookup} disabled={isScanning}>
                <Search className="h-4 w-4 mr-2" />
                Look Up
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleQRScan}
            disabled={isScanning}
            className="w-full"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {isScanning ? "Scanning..." : "Scan QR Code"}
          </Button>
        </div>
      </Card>

      {/* Warranty History Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Warranties</h2>
        <div className="space-y-3">
          {mockWarrantyHistory.map((item) => (
            <Card key={item.id} className="p-4">
              <button
                onClick={() => {
                  setSelectedHistoryItem(item);
                  setCurrentStep("status-detail");
                }}
                className="w-full text-left hover:bg-muted/50 transition-colors -m-4 p-4 rounded-lg"
              >
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{item.model}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">ID: {item.id}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {getStatusBadge(item.status)}
                        <p className="text-xs text-muted-foreground text-right whitespace-nowrap">
                          Exp: {new Date(item.warrantyExpiry).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatusDetailStep = () => {
    if (!selectedHistoryItem) return null;

    const getStatusDetails = (status: string) => {
      switch (status) {
        case "active":
          return {
            message: "Your warranty is active and valid.",
            color: "text-green-600",
            icon: CheckCircle,
            details: [
              "You can claim warranty for manufacturing defects",
              "Keep your purchase receipt safe",
              "Contact support for any issues"
            ]
          };
        case "expired":
          return {
            message: "Your warranty has expired.",
            color: "text-red-600",
            icon: AlertCircle,
            details: [
              "Warranty coverage has ended",
              "Paid repair services available",
              "Contact support for service options"
            ]
          };
        case "claimed":
          return {
            message: "Warranty claim has been processed.",
            color: "text-blue-600",
            icon: Package,
            details: [
              "Your warranty claim is being processed",
              "You will be contacted within 2-3 business days",
              "Track your claim status via email updates"
            ]
          };
        default:
          return {
            message: "Status unknown",
            color: "text-gray-600",
            icon: AlertCircle,
            details: []
          };
      }
    };

    const statusInfo = getStatusDetails(selectedHistoryItem.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("lookup")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Warranties
          </Button>
          <h1 className="text-2xl font-bold">Warranty Status</h1>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <img
              src={selectedHistoryItem.image}
              alt={selectedHistoryItem.name}
              className="w-20 h-20 object-cover rounded-lg bg-muted"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{selectedHistoryItem.name}</h2>
              <p className="text-muted-foreground">{selectedHistoryItem.model}</p>
              <p className="text-sm text-muted-foreground mt-1">ID: {selectedHistoryItem.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              <div>
                <p className={`font-medium ${statusInfo.color}`}>{statusInfo.message}</p>
                {getStatusBadge(selectedHistoryItem.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Serial Number:</span>
                  <span className="text-sm">{selectedHistoryItem.serialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Purchase Date:</span>
                  <span className="text-sm">{new Date(selectedHistoryItem.purchaseDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Warranty Expires:</span>
                  <span className="text-sm">{new Date(selectedHistoryItem.warrantyExpiry).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm">{selectedHistoryItem.category}</span>
                </div>
              </div>
            </div>

            {statusInfo.details.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">What this means:</h3>
                <ul className="space-y-1">
                  {statusInfo.details.map((detail, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedHistoryItem.status === "active" && (
              <Button
                onClick={() => {
                  setProduct(selectedHistoryItem);
                  setCurrentStep("claim-form");
                }}
                className="w-full mt-4"
              >
                Claim Warranty
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderDetailsStep = () => {
    if (!product) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("lookup")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Warranty Details</h1>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg bg-muted"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-muted-foreground">{product.model}</p>
              {getStatusBadge(product.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Serial Number:</span>
                <span className="text-sm">{product.serialNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Purchase Date:</span>
                <span className="text-sm">{new Date(product.purchaseDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Warranty Expires:</span>
                <span className="text-sm">{new Date(product.warrantyExpiry).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{product.category}</span>
              </div>
            </div>
          </div>

          {product.status === "active" && (
            <Button
              onClick={() => setCurrentStep("claim-form")}
              className="w-full"
            >
              Claim Warranty
            </Button>
          )}
        </Card>
      </div>
    );
  };

  const renderClaimForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("details")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Submit Warranty Claim</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div>
            <Label htmlFor="issue">Issue Description*</Label>
            <Textarea
              id="issue"
              placeholder="Please describe the issue you're experiencing..."
              value={claimForm.issueDescription}
              onChange={(e) => setClaimForm(prev => ({ ...prev, issueDescription: e.target.value }))}
              required
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name*</Label>
              <Input
                id="name"
                value={claimForm.customerName}
                onChange={(e) => setClaimForm(prev => ({ ...prev, customerName: e.target.value }))}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={claimForm.email}
                onChange={(e) => setClaimForm(prev => ({ ...prev, email: e.target.value }))}
                required
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={claimForm.phone}
              onChange={(e) => setClaimForm(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Your address for product collection/delivery"
              value={claimForm.address}
              onChange={(e) => setClaimForm(prev => ({ ...prev, address: e.target.value }))}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="invoice">Invoice/Receipt Upload</Label>
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <Input
                  id="invoice"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('invoice')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {claimForm.invoiceFile ? 'Change File' : 'Upload Invoice'}
                </Button>
                {claimForm.invoiceFile && (
                  <span className="text-sm text-muted-foreground">
                    {claimForm.invoiceFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: JPG, PNG, PDF (Max 5MB)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="logistics">Logistics Service*</Label>
            <Select 
              value={claimForm.logisticService} 
              onValueChange={(value) => setClaimForm(prev => ({ ...prev, logisticService: value }))}
              required
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose logistics service" />
              </SelectTrigger>
              <SelectContent>
                {logisticServices.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{service.label}</div>
                        <div className="text-xs text-muted-foreground">{service.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Submit Warranty Claim
          </Button>
        </form>
      </Card>
    </div>
  );

  const renderSubmittedStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      <div>
        <h1 className="text-2xl font-bold mb-2">Claim Submitted Successfully</h1>
        <p className="text-muted-foreground mb-4">
          Your warranty claim has been submitted. We'll contact you within 2-3 business days.
        </p>
        <p className="text-sm text-muted-foreground">
          Reference ID: <span className="font-mono font-semibold">WC{Date.now()}</span>
        </p>
      </div>
      <div className="space-y-2">
        <Button onClick={() => {
          setCurrentStep("lookup");
          setProduct(null);
          setWarrantyId("");
          setClaimForm({
            issueDescription: "",
            customerName: "",
            email: "",
            phone: "",
            address: "",
            invoiceFile: null,
            logisticService: ""
          });
        }} className="w-full">
          Submit Another Claim
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Warranty" />
      <div className="container max-w-2xl mx-auto px-6 py-8">
        {currentStep === "lookup" && renderLookupStep()}
        {currentStep === "status-detail" && renderStatusDetailStep()}
        {currentStep === "details" && renderDetailsStep()}
        {currentStep === "claim-form" && renderClaimForm()}
        {currentStep === "submitted" && renderSubmittedStep()}
      </div>
      <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
