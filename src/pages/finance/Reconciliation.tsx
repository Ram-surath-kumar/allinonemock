import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, ArrowRightLeft } from "lucide-react";

export function Reconciliation() {
  const [data, setData] = useState<{ system: any[]; bank: any[] }>({ system: [], bank: [] });
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await api.getUnmatchedTransactions();
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMatch = async () => {
    if (!selectedSystem || !selectedBank) return;
    setLoading(true);
    try {
      await api.matchTransaction({
        transaction_id: selectedSystem,
        bank_transaction_id: selectedBank,
      });
      toast.success("Transactions matched successfully.");
      setSelectedSystem(null);
      setSelectedBank(null);
      loadData();
    } catch (e) {
      toast.error("Failed to match transactions.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h2>
          <p className="text-muted-foreground">
            Match system receipts with bank statement entries.
          </p>
        </div>
        <Button onClick={handleMatch} disabled={!selectedSystem || !selectedBank || loading}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Match Selected
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* System Transactions */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>System Transactions</CardTitle>
            <CardDescription>Receipts generated in ERP (Unreconciled)</CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.system.map((tx) => (
                  <TableRow key={tx.id} className={selectedSystem === tx.id ? "bg-muted" : ""}>
                    <TableCell>
                      <input
                        type="radio"
                        name="sys"
                        checked={selectedSystem === tx.id}
                        onChange={() => setSelectedSystem(tx.id)}
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">₹{tx.amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tx.id.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
                {data.system.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No unmatched transactions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bank Transactions */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle>Bank Statement</CardTitle>
            <CardDescription>Uploaded/Mocked Bank Entries (Pending)</CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Desc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bank.map((tx) => (
                  <TableRow key={tx.id} className={selectedBank === tx.id ? "bg-muted" : ""}>
                    <TableCell>
                      <input
                        type="radio"
                        name="bank"
                        checked={selectedBank === tx.id}
                        onChange={() => setSelectedBank(tx.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tx.transaction_date || tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-bold">₹{tx.amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tx.description || "Deposit"}
                    </TableCell>
                  </TableRow>
                ))}
                {data.bank.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No unmatched bank entries
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
