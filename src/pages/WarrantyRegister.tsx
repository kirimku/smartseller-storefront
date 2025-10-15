import { useEffect, useMemo, useState } from "react";
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
import AddressPicker, { type AddressPickerValue } from "@/components/common/AddressPicker";
import { Loader2, ArrowLeft, Upload, QrCode, CheckCircle } from "lucide-react";

/**
 * Warranty Registration Page
 * - New dedicated URL: /warranty/register
 * - Focused flow: scan/enter barcode, minimal customer details, invoice upload
 * - Product details are not shown; derived from barcode validation
 */
const WarrantyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [barcode, setBarcode] = useState<string>(searchParams.get("barcode") || "");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  // Address fields
  const [addressLocation, setAddressLocation] = useState<AddressPickerValue | null>(null);
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setStateVal] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("ID");

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
          const data = res.data;
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
    const resolvedState = state || addressLocation?.province || "";
    const resolvedPostal = postalCode || addressLocation?.postalCode || "";
    const resolvedCity = city || addressLocation?.locationName || "";
    return (
      !!barcode &&
      !!serialNumber &&
      !!addressLine1 &&
      !!resolvedCity &&
      !!resolvedState &&
      !!resolvedPostal &&
      !!country
    );
  }, [barcode, serialNumber, addressLine1, city, state, postalCode, country, addressLocation]);

  const handleScanResult = (code: string) => {
    setBarcode(code);
    setIsScanning(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInvoiceFile(file);
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

    if (!isFormValid) {
      setError("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build FormData to support invoice upload alongside JSON fields
      const formData = new FormData();
      formData.append("barcode_value", barcode);
      if (productSku) formData.append("product_sku", productSku);
      formData.append("serial_number", serialNumber);

      if (invoiceFile) {
        formData.append("invoice_file", invoiceFile);
      }

      // Build customer_info with address moved from general registration
      const customerInfo = {
        first_name: user?.firstName || "",
        last_name: user?.lastName || "",
        email: user?.email || "",
        phone_number: user?.phone || "",
        address: {
          street: addressLine1 + (addressLine2 ? ` ${addressLine2}` : ""),
          city: city || addressLocation?.locationName || "",
          state: state || addressLocation?.province || "",
          postal_code: postalCode || addressLocation?.postalCode || "",
          country: country || "ID",
        },
      };

      formData.append("customer_info", JSON.stringify(customerInfo));

      const res = await warrantyService.registerWarranty(formData);
      if (res.success && res.data) {
        setSuccessMessage("Warranty registered successfully");
        // Navigate back to warranties list after short delay
        setTimeout(() => navigate("/warranty"), 800);
      } else {
        setError(res.error || res.message || "Failed to register warranty");
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
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={() => setIsScanning(true)}>
                    <QrCode className="h-4 w-4 mr-2" /> Scan Barcode
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Customer Address Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Customer Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressPicker
                    label="Location"
                    placeholder="Search city, district, area..."
                    value={addressLocation || undefined}
                    onChange={(val) => setAddressLocation(val)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine1">Street address</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter street address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment, suite, unit"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="Enter state/province"
                    value={state}
                    onChange={(e) => setStateVal(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div>
              <Label htmlFor="invoice">Upload Invoice (PDF or Image)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id="invoice" type="file" accept=".pdf,image/*" onChange={handleFileChange} />
                {invoiceFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-xs">
                    <Upload className="h-4 w-4 inline mr-1" /> {invoiceFile.name}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {successMessage && (
              <div className="text-green-600 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" /> {successMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={!isFormValid || isSubmitting} className="min-w-[160px]">
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