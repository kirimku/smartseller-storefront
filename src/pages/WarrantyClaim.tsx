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
import { Loader2, ArrowLeft, Truck, CheckCircle, MapPin } from "lucide-react";
import { warrantyService } from "@/services/warrantyService";
import { shippingService } from "@/services/shippingService";
import { type ClaimFormData, type SubmitClaimV2Request, type LogisticService, type ShippingCourierOption, type ShippingLocationOption } from "@/types/warranty";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import AddressPicker, { type AddressPickerValue } from "@/components/common/AddressPicker";
import { toast } from "sonner";

/**
 * Warranty Claim Page
 * - Dedicated URL: /warranty/claim
 * - Standalone claim form based on Warranty.tsx "claim-form" step
 * - Requires authentication; redirects to login if unauthenticated
 * - Includes detailed address, courier selection, and payment method
 */
// Courier types remain static for now
const courierTypes = [
  { value: "pickup", label: "Pickup Service", description: "Courier will pick up the product from your location" },
  { value: "dropoff", label: "Drop-off Service", description: "You drop off the product at service center" },
];

const PAYMENT_METHOD = "QRIS";

const WarrantyClaim: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auth guard
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isLoading: tenantLoading, slug } = useTenant();
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


  // Service selections
  const [courierType, setCourierType] = useState<string>("");
  const [logisticService, setLogisticService] = useState<string>("");
  // Payment method is fixed to QRIS
  const paymentMethod = PAYMENT_METHOD;

  // Shipping-related states
  const [destinationAddress, setDestinationAddress] = useState<ShippingLocationOption | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<ShippingCourierOption[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState<boolean>(false);

  // Form state
  const [claimForm, setClaimForm] = useState<ClaimFormData>({
    issueDescription: "",
    customerName: "",
    email: "",
    phone: "",
    address: "",
    logisticService: "",
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

  // Load shipping destinations and couriers when address location changes
  useEffect(() => {
    const loadShippingData = async () => {
      if (!addressLocation?.locationId || !slug) return;

      try {
        setLoadingCouriers(true);
        
        // Get destinations (warranty service centers)
        const destinationsResponse = await shippingService.getDestinations();
        if (destinationsResponse.destinations.length > 0) {
          const destination = destinationsResponse.destinations[0];
          setDestinationAddress({
            area_id: destination.area_id,
            name: destination.name,
            full_address: destination.address,
            city: destination.city,
            province: destination.province,
            postal_code: destination.postal_code
          });
          
          // Get couriers using the customer's address location as origin
          const couriersResponse = await shippingService.getStorefrontCouriers(slug, {
            from_city: addressLocation.city || '',
            from_district: addressLocation.district || '',
            to_city: destination.city,
            to_district: destination.area_name, // Using area_name as district for destination
            weight: 1000, // Default 1kg for warranty items
            length: 30,   // Default dimensions
            width: 20,
            height: 10,
            value: 100000, // Default value
            cod: false,
            insurance: true
          });
          
          const formattedCouriers = shippingService.formatCouriersForDropdown(couriersResponse.couriers);
          setAvailableCouriers(formattedCouriers);
          
          // Reset logistic service selection when couriers change
          setLogisticService('');
        }
      } catch (error) {
        console.error('Error loading shipping data:', error);
        
        // Provide specific error messages based on error type
        if (error.message?.includes('Authentication required')) {
          // This should not happen anymore with the fallback, but just in case
          toast.warning('Using default warranty service center for shipping calculation');
        } else if (error.message?.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error('Failed to load shipping options. Please try again.');
        }
        
        setAvailableCouriers([]);
      } finally {
        setLoadingCouriers(false);
      }
    };

    loadShippingData();
  }, [addressLocation?.locationId, slug]);

  // Build complete address string
  const completeAddress = useMemo(() => {
    const parts = [
      addressLine1,
      addressLocation?.city || addressLocation?.locationName,
      addressLocation?.province,
      addressLocation?.district,
      addressLocation?.kelurahan,
      addressLocation?.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  }, [addressLine1, addressLocation]);

  const isFormValid = useMemo(() => {
    const hasLocation = !!addressLocation;
    return (
      !!barcode &&
      !!claimForm.issueDescription &&
      !!claimForm.customerName &&
      !!claimForm.email &&
      !!addressLine1 &&
      hasLocation &&
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

      // Use RAW barcode directly per backend acceptance; no validation/ID resolution required
      const payload: SubmitClaimV2Request = {
        barcode,
        issue_description: claimForm.issueDescription,
        customer_name: claimForm.customerName,
        customer_email: claimForm.email,
        customer_phone: claimForm.phone,
        customer_address: completeAddress,
        courier_type: courierType as 'pickup' | 'dropoff',
        logistic_service: logisticService,
        payment_method: PAYMENT_METHOD,
        address_details: {
          street: addressLine1,
          city: addressLocation?.city || addressLocation?.locationName || "",
          state: addressLocation?.province || "",
          postal_code: addressLocation?.postalCode || "",
        },
        address_location: {
          province: addressLocation?.province || undefined,
          city: addressLocation?.city || addressLocation?.locationName || undefined,
          district: addressLocation?.district || undefined,
          postal_code: addressLocation?.postalCode || undefined,
          kelurahan: addressLocation?.kelurahan || (addressLocation?.locationType === 'area' ? addressLocation?.locationName || undefined : undefined),
        },

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
    <div className="min-h-screen bg-background pb-20">
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

                <div className="md:col-span-2">
                  <Label htmlFor="addressLine1">Alamat*</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter street address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="mt-2 h-12"
                  />
                </div>

              </div>
            </div>

            <Separator />

            {/* Service Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Preferences*</h3>

              {/* Destination Info */}
              {destinationAddress && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Warranty Service Center</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {destinationAddress.full_address}
                  </p>
                </div>
              )}

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
                <Label htmlFor="logisticService">Shipping Service*</Label>
                <Select 
                  value={logisticService} 
                  onValueChange={setLogisticService}
                  disabled={loadingCouriers || availableCouriers.length === 0}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue 
                      placeholder={
                        loadingCouriers 
                          ? "Loading shipping options..." 
                          : availableCouriers.length === 0 
                            ? "No shipping options available"
                            : "Select shipping service"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCouriers ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      availableCouriers.map((courier) => (
                        <SelectItem key={courier.value} value={courier.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{courier.label}</span>
                            <span className="text-xs text-muted-foreground">{courier.description}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!addressLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please select your address first to see shipping options
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="payment">Payment Method*</Label>
                <Input id="payment" value={PAYMENT_METHOD} disabled className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">QRIS is the only supported method.</p>
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