import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/common/Header";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Upload, Truck, CheckCircle, MapPin, CreditCard } from "lucide-react";
import { warrantyService } from "@/services/warrantyService";
import { type ClaimFormData, type SubmitClaimRequest, type LogisticService } from "@/types/warranty";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import AddressPicker, { type AddressPickerValue } from "@/components/common/AddressPicker";

/**
 * Warranty Claim Page
 * - Dedicated URL: /warranty/claim
 * - Standalone claim form based on Warranty.tsx "claim-form" step
 * - Requires authentication; redirects to login if unauthenticated
 * - Includes detailed address, courier selection, and payment method
 */
const logisticServices: LogisticService[] = [
  { value: "jne", label: "JNE Express", description: "2-3 business days" },
  { value: "jnt", label: "J&T Express", description: "1-2 business days" },
  { value: "sicepat", label: "SiCepat", description: "2-4 business days" },
  { value: "anteraja", label: "AnterAja", description: "2-3 business days" },
  { value: "pos", label: "Pos Indonesia", description: "3-5 business days" },
];

const courierTypes = [
  { value: "pickup", label: "Pickup Service", description: "Courier will pick up the product from your location" },
  { value: "dropoff", label: "Drop-off Service", description: "You drop off the product at service center" },
];

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer", description: "Transfer to company account" },
  { value: "e_wallet", label: "E-Wallet", description: "GoPay, OVO, DANA, ShopeePay" },
  { value: "credit_card", label: "Credit Card", description: "Visa, Mastercard, JCB" },
  { value: "cash", label: "Cash on Delivery", description: "Pay when product is delivered" },
];

const WarrantyClaim: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auth guard
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isLoading: tenantLoading } = useTenant();
  useEffect(() => {
    if (tenantLoading || isLoading) return;
    if (!isAuthenticated) {
      const intended = "/warranty/claim" + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      navigate(`/login?redirect=${encodeURIComponent(intended)}`, { replace: true });
    }
  }, [isAuthenticated, isLoading, tenantLoading, navigate, searchParams]);

  // Required claim context: barcode value (read-only)
  const [barcode, setBarcode] = useState<string>(searchParams.get("barcode") || searchParams.get("barcodeId") || "");

  // Address fields
  const [addressLocation, setAddressLocation] = useState<AddressPickerValue | null>(null);
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setStateVal] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("ID");

  // Service selections
  const [courierType, setCourierType] = useState<string>("");
  const [logisticService, setLogisticService] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Form state
  const [claimForm, setClaimForm] = useState<ClaimFormData>({
    issueDescription: "",
    customerName: "",
    email: "",
    phone: "",
    address: "",
    invoiceFile: null,
    logisticService: "",
    priority: "medium",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Prefill name/email if available from user profile
  useEffect(() => {
    if (!user) return;

    // Safely read user fields supporting both snake_case and camelCase
    const u = user as unknown as Record<string, unknown>;
    const first =
      typeof u["first_name"] === "string"
        ? (u["first_name"] as string)
        : typeof u["firstName"] === "string"
        ? (u["firstName"] as string)
        : "";
    const last =
      typeof u["last_name"] === "string"
        ? (u["last_name"] as string)
        : typeof u["lastName"] === "string"
        ? (u["lastName"] as string)
        : "";
    const email = typeof u["email"] === "string" ? (u["email"] as string) : "";
    const phone =
      typeof u["phone_number"] === "string"
        ? (u["phone_number"] as string)
        : typeof u["phone"] === "string"
        ? (u["phone"] as string)
        : "";

    setClaimForm((prev) => ({
      ...prev,
      customerName: prev.customerName || [first, last].filter(Boolean).join(" "),
      email: prev.email || email,
      phone: prev.phone || phone,
    }));
  }, [user]);

  // Build complete address string
  const completeAddress = useMemo(() => {
    const parts = [
      addressLine1,
      addressLine2,
      city || addressLocation?.locationName,
      state || addressLocation?.province,
      postalCode || addressLocation?.postalCode,
      country
    ].filter(Boolean);
    return parts.join(", ");
  }, [addressLine1, addressLine2, city, state, postalCode, country, addressLocation]);

  const isFormValid = useMemo(() => {
    const resolvedCity = city || addressLocation?.locationName || "";
    const resolvedState = state || addressLocation?.province || "";
    const resolvedPostal = postalCode || addressLocation?.postalCode || "";
    
    return (
      !!barcode &&
      !!claimForm.issueDescription &&
      !!claimForm.customerName &&
      !!claimForm.email &&
      !!addressLine1 &&
      !!resolvedCity &&
      !!resolvedState &&
      !!resolvedPostal &&
      !!courierType &&
      !!logisticService &&
      !!paymentMethod
    );
  }, [
    barcode, 
    claimForm.issueDescription,
    claimForm.customerName,
    claimForm.email,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    courierType,
    logisticService,
    paymentMethod,
    addressLocation
  ]);

  // Mobile nav tabs handling
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setClaimForm((prev) => ({ ...prev, invoiceFile: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!barcode) {
      setError("Please provide warranty barcode");
      return;
    }

    if (!isFormValid) {
      setError("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Resolve barcode ID from barcode value so API receives the correct ID
      let resolvedBarcodeId = barcode;
      try {
        const validation = await warrantyService.validateBarcode(barcode);
        const data = validation.data;
        if (validation.success && data) {
          resolvedBarcodeId = data.warranty_barcode?.id || data.warranty?.id || resolvedBarcodeId;
        }
      } catch (err) {
        console.warn("Barcode validation failed, falling back to submitted value", err);
      }

      const payload: SubmitClaimRequest = {
        barcode_id: resolvedBarcodeId,
        issue_description: claimForm.issueDescription,
        customer_name: claimForm.customerName,
        customer_email: claimForm.email,
        customer_phone: claimForm.phone,
        customer_address: completeAddress,
        priority: claimForm.priority || "medium",
        // Additional fields for enhanced claim
        courier_type: courierType,
        logistic_service: logisticService,
        payment_method: paymentMethod,
        address_details: {
          street: addressLine1 + (addressLine2 ? ` ${addressLine2}` : ""),
          city: city || addressLocation?.locationName || "",
          state: state || addressLocation?.province || "",
          postal_code: postalCode || addressLocation?.postalCode || "",
          country: country,
        }
      };

      const res = await warrantyService.submitClaim(payload);
      if (res.success) {
        setSuccessMessage(res.message || "Claim submitted successfully");
      } else {
        setError(res.error || res.message || "Failed to submit claim");
      }
    } catch (err) {
      console.error("Submit claim error", err);
      setError("Failed to submit claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileNav activeTab="warranty" onTabChange={handleTabChange} />
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/warranty")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Warranty
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-2">Submit Warranty Claim</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Provide issue details, location, and service preferences. We will process your claim within 2-3 business days.
          </p>

          {/* Warranty Barcode (read-only info) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-4">
            <div>
              <Label>Warranty Barcode</Label>
              <div className="mt-2 px-3 py-2 rounded border bg-muted text-sm">
                {barcode || "No barcode provided"}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Description */}
            <div>
              <Label htmlFor="issue">Issue Description*</Label>
              <Textarea
                id="issue"
                placeholder="Describe the issue you're experiencing"
                value={claimForm.issueDescription}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, issueDescription: e.target.value }))}
                required
                className="mt-2"
              />
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name*</Label>
                <Input
                  id="name"
                  value={claimForm.customerName}
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, customerName: e.target.value }))}
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
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={claimForm.phone}
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <Separator />

            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pickup/Delivery Address*</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressPicker
                    label="Location"
                    placeholder="Search city, district, area..."
                    type="area"
                    value={addressLocation || undefined}
                    onChange={(val) => setAddressLocation(val)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine1">Street Address*</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter street address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment, suite, unit, etc."
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province*</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setStateVal(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="postal">Postal Code*</Label>
                  <Input
                    id="postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country*</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="MY">Malaysia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Preferences*</h3>

              <div>
                <Label htmlFor="courier">Courier Type*</Label>
                <Select value={courierType} onValueChange={setCourierType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select courier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup Service</SelectItem>
                    <SelectItem value="dropoff">Drop-off Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="logistic">Logistic Service*</Label>
                <Select value={logisticService} onValueChange={setLogisticService}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select logistic service" />
                  </SelectTrigger>
                  <SelectContent>
                    {logisticServices.map((svc) => (
                      <SelectItem key={svc.value} value={svc.value}>{svc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment">Payment Method*</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="e_wallet">E-Wallet</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Proof of Purchase */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Proof of Purchase</h3>
              <div>
                <Label htmlFor="invoice">Upload Invoice (PDF or Image)</Label>
                <div className="flex items-center gap-2 mt-2">
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
                    onClick={() => document.getElementById("invoice")?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {claimForm.invoiceFile ? "Change File" : "Upload Invoice"}
                  </Button>
                  {claimForm.invoiceFile && (
                    <span className="text-sm text-muted-foreground">{claimForm.invoiceFile.name}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Accepted formats: JPG, PNG, PDF (Max 5MB)</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Claim...
                </>
              ) : (
                "Submit Warranty Claim"
              )}
            </Button>

            {error && (
              <div className="text-sm text-red-600" role="alert">{error}</div>
            )}
          </form>
        </Card>

        {successMessage && (
          <Card className="p-6 mt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-2">Claim Submitted Successfully</h3>
            <p className="text-muted-foreground mt-1">{successMessage}</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button onClick={() => navigate("/warranty")}>
                Back to Warranty
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>Return to Home</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WarrantyClaim;