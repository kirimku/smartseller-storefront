import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  QrCode,
  Timer,
  RefreshCw,
  Copy,
} from "lucide-react";

const formatIDR = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
    amount
  );

const Invoice: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { tenant } = useTenant();

  // Mock invoice data while backend is being fixed
  const [status, setStatus] = useState<"awaiting_payment" | "paid" | "expired">(
    "awaiting_payment"
  );
  const [expiresIn, setExpiresIn] = useState<number>(15 * 60); // 15 minutes

  const amount = useMemo(() => {
    // Simple mock: derive amount from orderId characters for demo consistency
    const base = 150000;
    const modifier = (orderId || "").split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 50000;
    return base + modifier;
  }, [orderId]);

  const merchantName = tenant?.branding?.storeName || tenant?.name || "SmartSeller Store";

  // Generate a mock QRIS payload — placeholder until backend provides actual token/payload
  const [nonce, setNonce] = useState<string>(() => Math.random().toString(36).slice(2));
  const qrPayload = useMemo(() => {
    // This is NOT a real QRIS EMV payload; it is a placeholder for UI testing
    // Replace with actual QRIS string/token returned by backend later.
    const params = new URLSearchParams({
      merchant: merchantName,
      order_id: orderId || "unknown",
      amount: String(amount),
      currency: "IDR",
      expires_in: String(expiresIn),
      nonce,
    });
    return `https://pay.example/qris?${params.toString()}`;
  }, [merchantName, orderId, amount, expiresIn, nonce]);

  // Countdown for QR expiry
  useEffect(() => {
    if (status !== "awaiting_payment") return;
    const timer = setInterval(() => {
      setExpiresIn((sec) => (sec > 0 ? sec - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (expiresIn === 0 && status === "awaiting_payment") {
      setStatus("expired");
    }
  }, [expiresIn, status]);

  const handleRefreshQR = () => {
    setNonce(Math.random().toString(36).slice(2));
    setExpiresIn(15 * 60);
    setStatus("awaiting_payment");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
    } catch (e) {
      // no-op for demo; could show a toast
    }
  };

  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Invoice #{orderId}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{merchantName}</p>
            </div>
            <div>
              {status === "awaiting_payment" && (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  Awaiting Payment
                </Badge>
              )}
              {status === "paid" && (
                <Badge variant="secondary" className="text-green-700">
                  Paid
                </Badge>
              )}
              {status === "expired" && (
                <Badge variant="destructive">Expired</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "expired" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This QR code has expired. Please refresh to generate a new one.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                <QRCode value={qrPayload} size={192} />
                <p className="text-sm text-muted-foreground mt-3">Scan with your mobile banking or e-wallet (QRIS)</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Payment Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRefreshQR} disabled={status === "awaiting_payment" && expiresIn > 0}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh QR
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                  <Timer className="h-4 w-4" />
                  Expires in {minutes}:{seconds}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Payment Instructions</h3>
                <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Open your mobile banking or e-wallet app.</li>
                  <li>Choose the QRIS payment option.</li>
                  <li>Scan the QR code displayed on this page.</li>
                  <li>Confirm the merchant and amount: {merchantName}, {formatIDR(amount)}.</li>
                  <li>Complete the payment before the timer expires.</li>
                </ol>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Merchant</span>
                  <span className="font-medium">{merchantName}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Order ID</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatIDR(Math.max(amount - 5000, 0))}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">{formatIDR(5000)}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total</span>
                  <span className="text-lg font-semibold">{formatIDR(amount)}</span>
                </div>
              </div>

              {status === "paid" ? (
                <Alert className="border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Payment confirmed. Thank you! Your invoice is marked as paid.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    After payment, this page will update automatically when backend confirmation is available.
                    For now, this is a placeholder UI for QRIS.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Button variant="default" onClick={() => navigate("/my-orders")}>Back to Orders</Button>
                <Button variant="outline" onClick={() => navigate("/profile")}>Contact Support</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoice;