import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Save, FilePlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Accounting() {
  const [coa, setCoa] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCoa();
  }, []);

  const loadCoa = async () => {
    setLoading(true);
    try {
      const res = await api.getChartOfAccounts();
      if (res.data) setCoa(res.data);
      else setCoa([]); // ensure array
    } catch (e) {
      console.error("Failed to load COA", e);
      toast.error("Failed to load Chart of Accounts");
      setCoa([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="journal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="journal">Journal Entry</TabsTrigger>
          <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <JournalEntryForm coa={coa} onSuccess={loadCoa} />
        </TabsContent>

        <TabsContent value="coa" className="mt-6">
          <ChartOfAccounts coa={coa} onUpdate={loadCoa} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChartOfAccounts({ coa, onUpdate }: { coa: any[]; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: "", name: "", type: "asset", subtype: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = async () => {
    if (!newAccount.code || !newAccount.name) {
      toast.error("Code and Name are required");
      return;
    }
    const res = await api.createAccount(newAccount);
    if (res.data) {
      toast.success("Account created successfully");
      setOpen(false);
      setNewAccount({ code: "", name: "", type: "asset", subtype: "" });
      onUpdate();
    } else {
      toast.error(res.error || "Failed to create account");
    }
  };

  const filteredCoa = coa.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by Type
  const grouped = filteredCoa.reduce(
    (acc, curr) => {
      const type = curr.type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>Manage your ledger accounts structure</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>Create a new ledger account code.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code</Label>
                  <Input
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g., 1001"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Name</Label>
                  <Input
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g., Cash"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(v) => setNewAccount({ ...newAccount, type: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Sub-type</Label>
                  <Input
                    value={newAccount.subtype}
                    onChange={(e) => setNewAccount({ ...newAccount, subtype: e.target.value })}
                    className="col-span-3"
                    placeholder="Optional (e.g. Current Asset)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sub-type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([type, accounts]) => (
              <>
                <TableRow key={`header-${type}`} className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold capitalize text-primary">
                    {type}
                  </TableCell>
                </TableRow>
                {accounts.map((acct) => (
                  <TableRow key={acct.id}>
                    <TableCell className="font-mono">{acct.code}</TableCell>
                    <TableCell className="font-medium">{acct.name}</TableCell>
                    <TableCell className="capitalize">
                      <Badge variant="outline">{acct.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{acct.subtype || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={acct.is_active !== false ? "default" : "secondary"}>
                        {acct.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
            {filteredCoa.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No accounts found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function JournalEntryForm({ coa, onSuccess }: { coa: any[]; onSuccess: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false); // Fix: Added missing loading state
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<
    { account_id: string; debit: string; credit: string; description: string }[]
  >([
    { account_id: "", debit: "", credit: "", description: "" },
    { account_id: "", debit: "", credit: "", description: "" },
  ]);

  const addLine = () =>
    setLines([...lines, { account_id: "", debit: "", credit: "", description: "" }]);
  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    // @ts-ignore
    newLines[index][field] = value;
    setLines(newLines);
  };
  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    } else {
      toast.warning("Journal entry requires at least 2 lines");
    }
  };

  const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  const handleSubmit = async () => {
    if (Math.abs(difference) > 0.01) {
      toast.error(`Debits must equal Credits. Difference: ${difference.toFixed(2)}`);
      return;
    }
    if (totalDebit === 0) {
      toast.error("Total amount cannot be zero");
      return;
    }
    if (!desc) {
      toast.error("Description / Narration is required");
      return;
    }
    const validLines = lines.filter((l) => l.account_id);
    if (validLines.length < 2) {
      toast.error("At least two accounts are required");
      return;
    }

    setLoading(true); // Fix: Start loading

    const res = await api.createJournalEntry({
      date,
      description: desc,
      lines: validLines.map((l) => ({
        account_id: l.account_id,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description,
      })),
      created_by: "current-user-uuid", // TODO: Get from context/auth
    });

    if (res.data) {
      toast.success("Journal Posted Successfully");
      // Reset form
      setDesc("");
      setLines([
        { account_id: "", debit: "", credit: "", description: "" },
        { account_id: "", debit: "", credit: "", description: "" },
      ]);
      onSuccess();
    } else {
      toast.error(res.error || "Failed to post journal");
    }
    setLoading(false); // Fix: End loading
  };

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>New Journal Entry</CardTitle>
            <CardDescription>Record a new manual journal entry</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm py-1 px-3">
            Draft
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Journal Narration (Header Description)</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Purchase of Office Computers"
            />
          </div>
        </div>

        {/* Lines Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[30%]">Account</TableHead>
                <TableHead className="w-[30%]">Line Description</TableHead>
                <TableHead className="w-[15%] text-right">Debit</TableHead>
                <TableHead className="w-[15%] text-right">Credit</TableHead>
                <TableHead className="w-[10%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={index} className="group hover:bg-muted/20">
                  <TableCell>
                    <Select
                      value={line.account_id}
                      onValueChange={(v) => updateLine(index, "account_id", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {coa.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-mono text-muted-foreground mr-2">{a.code}</span>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(index, "description", e.target.value)}
                      placeholder="Details (Optional)"
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.debit}
                      onChange={(e) => {
                        updateLine(index, "debit", e.target.value);
                        if (parseFloat(e.target.value) > 0) updateLine(index, "credit", "");
                      }}
                      placeholder="0.00"
                      className="text-right h-9 font-mono"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.credit}
                      onChange={(e) => {
                        updateLine(index, "credit", e.target.value);
                        if (parseFloat(e.target.value) > 0) updateLine(index, "debit", "");
                      }}
                      placeholder="0.00"
                      className="text-right h-9 font-mono"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="bg-muted/30 p-2 flex justify-center border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={addLine}
              className="text-primary hover:text-primary"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Line
            </Button>
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-[30%_30%_15%_15%_10%] p-4 bg-muted/50 font-semibold text-sm border-t">
            <div className="col-span-2 text-right pr-4 pt-2">Totals</div>
            <div className="text-right pt-2 font-mono">{totalDebit.toFixed(2)}</div>
            <div className="text-right pt-2 font-mono">{totalCredit.toFixed(2)}</div>
            <div></div>
          </div>
        </div>

        {difference !== 0 && (
          <div className="flex justify-end text-destructive text-sm font-medium items-center">
            <span className="bg-destructive/10 px-3 py-1 rounded-full">
              Difference: {Math.abs(difference).toFixed(2)}{" "}
              {difference > 0 ? "(Dr > Cr)" : "(Cr > Dr)"}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-4 border-t pt-6">
        <Button
          variant="outline"
          onClick={() =>
            setLines([
              { account_id: "", debit: "", credit: "", description: "" },
              { account_id: "", debit: "", credit: "", description: "" },
            ])
          }
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={Math.abs(difference) > 0.01 || loading}
          className="min-w-[150px]"
        >
          {loading ? (
            "Posting..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Post Journal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
