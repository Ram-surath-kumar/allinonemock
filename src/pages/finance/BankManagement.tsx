import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function BankManagement() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);

  // Form States
  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_number: "",
    branch_name: "",
    ifsc_code: "",
    opening_balance: 0,
  });
  const [newTx, setNewTx] = useState({ type: "deposit", amount: "", description: "" });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedBank) loadTransactions(selectedBank);
  }, [selectedBank]);

  const loadAccounts = async () => {
    const res = await api.getBankAccounts();
    if (res.data) setAccounts(res.data);
  };

  const loadTransactions = async (bankId: string) => {
    const res = await api.getBankTransactions(bankId);
    if (res.data) setTransactions(res.data);
  };

  const handleAddBank = async () => {
    const res = await api.createBankAccount(newBank);
    if (res.data) {
      toast.success("Bank Account Added");
      setIsAddOpen(false);
      loadAccounts();
    } else {
      toast.error("Failed to add bank account");
    }
  };

  const handleAddTx = async () => {
    if (!selectedBank) return;
    const res = await api.createBankTransaction({
      bank_id: selectedBank,
      type: newTx.type,
      amount: parseFloat(newTx.amount),
      description: newTx.description,
    });
    if (res.data) {
      toast.success("Transaction Recorded");
      setIsTxOpen(false);
      loadAccounts(); // Update balances
      loadTransactions(selectedBank); // Update tx list
      setNewTx({ type: "deposit", amount: "", description: "" });
    } else {
      toast.error("Failed to record transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Bank Management</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">+ Add Bank Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={newBank.bank_name}
                    onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account No</Label>
                  <Input
                    value={newBank.account_number}
                    onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={newBank.branch_name}
                    onChange={(e) => setNewBank({ ...newBank, branch_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC</Label>
                  <Input
                    value={newBank.ifsc_code}
                    onChange={(e) => setNewBank({ ...newBank, ifsc_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  value={newBank.opening_balance}
                  onChange={(e) =>
                    setNewBank({ ...newBank, opening_balance: parseFloat(e.target.value) })
                  }
                />
              </div>
              <Button onClick={handleAddBank} className="w-full">
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className={`cursor-pointer hover:border-primary transition-colors ${selectedBank === acc.id ? "border-primary ring-1 ring-primary" : ""}`}
            onClick={() => setSelectedBank(acc.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{acc.bank_name}</CardTitle>
              <CardDescription>{acc.account_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
                  acc.current_balance || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{acc.branch_name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBank && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Record Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Bank Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newTx.type}
                      onValueChange={(val) => setNewTx({ ...newTx, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit (+)</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newTx.amount}
                      onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newTx.description}
                      onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddTx} className="w-full">
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell
                      className={
                        tx.type === "deposit"
                          ? "text-green-600 capitalize"
                          : "text-red-600 capitalize"
                      }
                    >
                      {tx.type}
                    </TableCell>
                    <TableCell className="text-right font-medium">{tx.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
