import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { Header } from "@/components/common/Header";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BarcodeScanner } from "@/components/common/BarcodeScanner";
import { warrantyService } from "@/services/warrantyService";
import { 
  ValidateBarcodeResponse,
  CustomerWarrantyRegistrationRequest,
  CustomerWarrantyRegistrationResponse
} from "@/types/warranty";
import { 
  QrCode, 
  Search, 
  Package, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Upload,
  FileText
} from "lucide-react";

/**
 * Warranty Registration Page
 * - New dedicated URL: /warranty/register
 * - Focused flow: scan/enter barcode, minimal customer details
 * - Product details are not shown; derived from barcode validation
 * - Location/address removed - only needed for claims
 */
const WarrantyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [barcode, setBarcode] = useState<string>(searchParams.get("barcode") || "");
  const [proofOfPurchase, setProofOfPurchase] = useState<File | null>(null);
  const [proofOfPurchasePreview, setProofOfPurchasePreview] = useState<string>("");
  // Deprecated: separate upload result; now we send file directly on submit
  // const [proofOfPurchaseData, setProofOfPurchaseData] = useState<{
  //   document_type: 'pdf' | 'image';
  //   document_url: string;
  //   uploaded_at: string;
  // } | null>(null);
  // const [isUploadingProof, setIsUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derived from validation
  const [productSku, setProductSku] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [validatedDetails, setValidatedDetails] = useState<{
    name?: string;
    sku?: string;
    brand?: string;
    model?: string;
    category?: string;
    image_url?: string;
    status?: string;
    warranty_period?: string;
    expiry_date?: string;
    activated_at?: string;
    days_remaining?: number;
  } | null>(null);

  // UI state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Auth guard: require login to access register page
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isLoading: tenantLoading } = useTenant();
  useEffect(() => {
    // Wait for tenant and auth to finish initializing before deciding
    if (tenantLoading || isLoading) return;
    if (!isAuthenticated) {
      const intended = `/warranty/register${barcode ? `?barcode=${encodeURIComponent(barcode)}` : ''}`;
      navigate(`/login?redirect=${encodeURIComponent(intended)}`, { replace: true });
    }
  }, [isAuthenticated, isLoading, tenantLoading, barcode, navigate]);

  // Validate barcode when provided to derive product fields
  useEffect(() => {
    const runValidation = async () => {
      if (!barcode) return;
      try {
        const res = await warrantyService.validateBarcode(barcode);
        if (res.success && res.data) {
          const data = res.data as ValidateBarcodeResponse;
          // Pull from either classic or alternate shape
          const sku = data.product?.sku || data.warranty_barcode?.product_id || "";
          const serial = data.warranty?.barcode_value || data.warranty?.barcode || data.warranty_barcode?.barcode_string || barcode;
          setProductSku(String(sku));
          setSerialNumber(String(serial));

          // Normalize details for top-of-form display
          const details = {
            name: data.product?.name || data.warranty_barcode?.product_name,
            sku: data.product?.sku,
            brand: data.product?.brand,
            model: data.product?.model || data.warranty_barcode?.product_model,
            category: data.product?.category || data.warranty_barcode?.product_category,
            image_url: data.product?.image_url,
            status: data.warranty?.status || data.warranty_barcode?.status,
            warranty_period:
              data.warranty?.warranty_period ||
              (data.warranty_barcode?.warranty_period_months !== undefined
                ? `${data.warranty_barcode.warranty_period_months} months`
                : undefined),
            expiry_date: data.warranty?.expiry_date || data.warranty_barcode?.expiry_date,
            activated_at: data.warranty?.activated_at || data.warranty_barcode?.activation_date,
            days_remaining: data.warranty?.days_remaining,
          };
          setValidatedDetails(details);
          setError("");
        } else {
          setError(res.message || "Failed to validate barcode");
        }
      } catch (e) {
        console.error("Barcode validation error", e);
        setError("Failed to validate barcode");
      }
    };
    runValidation();
  }, [barcode]);

  const isFormValid = useMemo(() => {
    // Registration requires barcode and a selected proof file
    return !!barcode && !!proofOfPurchase;
  }, [barcode, proofOfPurchase]);

  const handleProofOfPurchaseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid image (JPG, PNG) or PDF file");
        return;
      }

      // Store the file for preview and submission
      setProofOfPurchase(file);
      setError("");
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setProofOfPurchasePreview(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofOfPurchasePreview("");
      }
    }
  };

  const handleScanResult = (code: string) => {
    setBarcode(code);
    setIsScanning(false);
  };

  // Provide MobileNav tab handling consistent with the main Warranty page
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "warranty":
        navigate("/warranty");
        break;
      case "shop":
        navigate("/");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        navigate("/warranty");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Specific error for missing barcode before general validation
    if (!barcode) {
      setError("Please enter a barcode");
      return;
    }

    if (!proofOfPurchase) {
      setError("Please select proof of purchase file");
      return;
    }

    if (!isFormValid) {
      setError("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build FormData for registration: barcode and optional proof of purchase
      const formData = new FormData();
      formData.append("barcode", barcode);
      
      // Attach proof file directly to registration request
      if (proofOfPurchase) {
        const documentType = proofOfPurchase.type === 'application/pdf' ? 'pdf' : 'image';
        formData.append("file", proofOfPurchase);
        formData.append("document_type", documentType);
      }

      const res = await warrantyService.registerWarranty(formData);
      if ('success' in res && res.success) {
        setSuccessMessage("Warranty registered successfully! Admin will verify and activate it.");
        // Navigate back to warranties list after short delay
        setTimeout(() => navigate("/warranty"), 1500);
      } else {
        const errorRes = res as { success: false; error: string; message?: string };
        setError(errorRes.error || errorRes.message || "Failed to register warranty");
      }
    } catch (err) {
      console.error("Register warranty error", err);
      setError("Failed to register warranty");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileNav activeTab="warranty" onTabChange={handleTabChange} />
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate("/warranty")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Warranty
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-2">Register New Product</h2>
          <p className="text-muted-foreground mb-4">
            Register your product for warranty coverage. Admin will verify and activate your warranty.
          </p>
          
          {/* Display validated product warranty details at the top */}
          {validatedDetails && (
            <div className="mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {validatedDetails.name || "Product"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {validatedDetails.brand ? `${validatedDetails.brand} • ` : ""}
                        {validatedDetails.model || "Model N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                    <div className="text-muted-foreground">SKU</div>
                    <div>{validatedDetails.sku || productSku || "-"}</div>
                    <div className="text-muted-foreground">Warranty</div>
                    <div>{validatedDetails.warranty_period || "-"}</div>
                    <div className="text-muted-foreground">Serial</div>
                    <div>{serialNumber || "-"}</div>
                  </div>
                </div>
                {/* Image placeholder or validated image */}
                <img
                  src={validatedDetails.image_url || "/placeholder.svg"}
                  alt="Product"
                  className="w-16 h-16 rounded border"
                />
              </div>
            </div>
          )}
          <Separator className="my-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Barcode *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={() => setIsScanning(true)}>
                    <QrCode className="h-4 w-4 mr-2" /> Scan
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="proof_of_purchase" className="block mb-1">Proof of Purchase *</Label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    id="proof_of_purchase"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleProofOfPurchaseChange}
                    className="sr-only"
                  />
                  <div className="flex items-center h-10">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Choose file
                    </Button>
                    {proofOfPurchase && (
                      <span className="ml-3 text-sm text-muted-foreground truncate max-w-[240px]">
                        {proofOfPurchase.name}
                      </span>
                    )}
                  </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required. Upload receipt, invoice, or other proof of purchase (JPG, PNG, PDF, max 5MB)
                </p>
              </div>
              
              {/* Removed immediate upload; file will be sent with registration */}
              
              {/* Removed immediate upload status UI; file is attached on submit */}
              
              {proofOfPurchase && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>File selected</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <FileText className="h-4 w-4" />
                    <span>{proofOfPurchase.name} ({proofOfPurchase.type === 'application/pdf' ? 'PDF' : 'IMAGE'})</span>
                  </div>
                </div>
              )}
              
              {proofOfPurchasePreview && proofOfPurchase?.type.startsWith('image/') && (
                <div className="mt-2">
                  <img
                    src={proofOfPurchasePreview}
                    alt="Proof of purchase preview"
                    className="max-w-xs max-h-32 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {successMessage && (
              <div className="text-green-600 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" /> {successMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={!isFormValid || isSubmitting} className="h-10 px-4">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Register Product</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/warranty")}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <BarcodeScanner 
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onScan={(code) => handleScanResult(code)}
          title="Scan Barcode"
          description="Position the barcode within the camera view"
        />
      </div>
    </div>
  );
};

export default WarrantyRegister;