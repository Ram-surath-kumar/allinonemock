import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Wallet, Smartphone } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { RippleLoader } from "@/components/ui/RippleLoader";

interface PaymentGatewayMockProps {
  assignment: any;
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentGatewayMock({ assignment, onSuccess, onClose }: PaymentGatewayMockProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"method" | "details" | "processing" | "success">("method");
  const [method, setMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setStep("processing");

    // Simulate network delay
    setTimeout(async () => {
      try {
        const res = await api.payOnlineMock({
          student_id: assignment.student_id,
          assignment_id: assignment.id,
          amount: assignment.net_amount - (assignment.paid_amount || 0),
          gateway_provider: method === "upi" ? "Razorpay" : "Stripe",
        });

        if (res.data) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          toast.error("Payment failed");
          setStep("details");
        }
      } catch (error) {
        toast.error("Payment error");
        setStep("details");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure Payment Gateway</DialogTitle>
          <DialogDescription>
            Paying:{" "}
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
              assignment.net_amount - (assignment.paid_amount || 0)
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="space-y-4 py-4">
            <Label>Select Payment Method</Label>
            <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-1 gap-4">
              <Label
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${method === "card" ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Credit / Debit Card</span>
                </div>
              </Label>
              <Label
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${method === "upi" ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="upi" id="upi" />
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">UPI / QR Code</span>
                </div>
              </Label>
              <Label
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${method === "wallet" ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Wallets</span>
                </div>
              </Label>
            </RadioGroup>
            <Button className="w-full" onClick={() => setStep("details")}>
              Continue
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4 py-4">
            {method === "card" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {method === "upi" && (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=school@bank&pn=SchoolSphere&am=100"
                  alt="QR Code"
                  className="mb-4 mix-blend-multiply opacity-80"
                />
                <p className="text-sm text-muted-foreground">Scan with any UPI App</p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handlePay}
              disabled={method === "card" && !cardNumber}
            >
              Pay Securely
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("method")}>
              Back
            </Button>
          </div>
        )}

        {/* Removed nested import */}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <RippleLoader className="min-h-[200px]" />
            <p className="text-lg font-medium">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground">
              Transaction ID: TXN-{Date.now().toString().slice(-6)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
