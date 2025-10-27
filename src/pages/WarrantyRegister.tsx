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
  const { isLoading: tenantLoading, slug } = useTenant();

  // Ensure warrantyService has the current storefront slug
  useEffect(() => {
    console.log('[WarrantyRegister] Tenant slug effect', { slug });
    if (slug) {
      try {
        console.log('[WarrantyRegister] Setting warrantyService slug', slug);
        warrantyService.setStorefrontSlug(slug);
        console.log('[WarrantyRegister] warrantyService slug set');
      } catch (e) {
        console.warn('Failed to set storefront slug for warrantyService:', e);
      }
    }
  }, [slug]);

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
      if (!barcode || !slug) return;
      try {
        console.log('[WarrantyRegister] validateBarcode call', { barcode, slug });
        const res = await warrantyService.validateBarcode(barcode);
        console.log('[WarrantyRegister] validateBarcode result', { success: res.success });
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
  }, [barcode, slug]);

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

    // Ensure storefront slug available before calling service
    if (!slug) {
      setError("Storefront is initializing. Please wait a moment and retry.");
      return;
    }

    setIsSubmitting(true);
    console.log('[WarrantyRegister] register submit', { barcode, hasProof: !!proofOfPurchase, slug });

    try {
      // Build FormData for registration: barcode and optional proof of purchase
      const formData = new FormData();
      formData.append('barcode', barcode);
      if (proofOfPurchase) {
        formData.append('proof_of_purchase', proofOfPurchase);
      }
      console.log('[WarrantyRegister] calling registerWarranty');
      const res = await warrantyService.registerWarranty(formData);
      console.log('[WarrantyRegister] registerWarranty result', { success: 'success' in res ? res.success : undefined });
      if ('success' in res && res.success) {
        setSuccessMessage('Warranty registered successfully!');
        // Navigate back to warranties list after short delay
        setTimeout(() => navigate('/warranty'), 1500);
      } else {
        const errorRes = res as { success: false; error: string; message?: string };
        setError(errorRes.error || errorRes.message || 'Failed to register warranty');
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
            Scan or input the product warranty barcode, then upload proof of purchase to register.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-4">
            <div>
              <Label>Warranty Barcode</Label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter or scan product barcode"
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setIsScanning(true)}>
                <QrCode className="h-4 w-4 mr-2" /> Scan Barcode
              </Button>
            </div>
          </div>

          {/* Validated product details preview */}
          {validatedDetails && (
            <div className="bg-muted/50 border rounded p-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Detected Product</span>
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span><span className="font-medium">Name:</span> {validatedDetails.name || '-'}</span>
                <span><span className="font-medium">Model:</span> {validatedDetails.model || '-'}</span>
                <span><span className="font-medium">Category:</span> {validatedDetails.category || '-'}</span>
                <span><span className="font-medium">Status:</span> {validatedDetails.status || '-'}</span>
                <span><span className="font-medium">Expiry:</span> {validatedDetails.expiry_date || '-'}</span>
                <span><span className="font-medium">Activated:</span> {validatedDetails.activated_at || '-'}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Proof of Purchase Upload */}
          <div className="space-y-3 mt-4">
            <Label>Proof of Purchase*</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*,application/pdf" onChange={handleProofOfPurchaseChange} ref={fileInputRef} />
              {proofOfPurchase && (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Replace File
                </Button>
              )}
            </div>
            {proofOfPurchasePreview && (
              <div className="mt-2">
                <img src={proofOfPurchasePreview} alt="Proof Preview" className="h-32 rounded border" />
              </div>
            )}
          </div>

          <Separator />

          {/* Submit */}
          <Button type="submit" className="w-full mt-6" onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registering...
              </>
            ) : (
              "Register Warranty"
            )}
          </Button>

          {error && (
            <div className="text-sm text-red-600 mt-2" role="alert">{error}</div>
          )}

          {successMessage && (
            <div className="text-sm text-green-600 mt-2">{successMessage}</div>
          )}
        </Card>

        {/* Barcode Scanner Modal */}
        {isScanning && (
          <Card className="p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                <span className="text-sm font-medium">Scan Warranty Barcode</span>
              </div>
              <Button variant="ghost" onClick={() => setIsScanning(false)}>Close</Button>
            </div>
            {/* Pass required isOpen prop to Scanner */}
            <BarcodeScanner isOpen={isScanning} onScan={handleScanResult} onClose={() => setIsScanning(false)} />
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileNav activeTab="warranty" onTabChange={handleTabChange} />
    </div>
  );
};

export default WarrantyRegister;