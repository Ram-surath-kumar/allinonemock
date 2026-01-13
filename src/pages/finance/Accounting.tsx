import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export function Accounting() {
    const [coa, setCoa] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCoa();
    }, []);

    const loadCoa = async () => {
        setLoading(true);
        const res = await api.getChartOfAccounts();
        if (res.data) setCoa(res.data);
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <Tabs defaultValue="journal">
                <TabsList>
                    <TabsTrigger value="journal">Journal Entry</TabsTrigger>
                    <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
                </TabsList>

                <TabsContent value="journal">
                    <JournalEntryForm coa={coa} />
                </TabsContent>

                <TabsContent value="coa">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chart of Accounts</CardTitle>
                            <CardDescription>List of all ledger accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coa.map(acct => (
                                        <TableRow key={acct.id}>
                                            <TableCell className="font-mono">{acct.code}</TableCell>
                                            <TableCell className="font-medium">{acct.name}</TableCell>
                                            <TableCell className="capitalize">{acct.type}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function JournalEntryForm({ coa }: { coa: any[] }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [desc, setDesc] = useState('');
    const [lines, setLines] = useState<{ account_id: string, debit: number, credit: number }[]>([
        { account_id: '', debit: 0, credit: 0 },
        { account_id: '', debit: 0, credit: 0 }
    ]);

    const addLine = () => setLines([...lines, { account_id: '', debit: 0, credit: 0 }]);
    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        // @ts-ignore
        newLines[index][field] = value;
        setLines(newLines);
    };
    const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    const handleSubmit = async () => {
        if (totalDebit !== totalCredit) {
            toast.error(`Debits (${totalDebit}) must equal Credits (${totalCredit})`);
            return;
        }
        if (totalDebit === 0) {
            toast.error("Amount cannot be zero");
            return;
        }
        if (!desc) {
            toast.error("Description is required");
            return;
        }

        const res = await api.createJournalEntry({
            date,
            description: desc,
            lines: lines.filter(l => l.account_id),
            created_by: 'current-user-uuid'
        });

        if (res.data) {
            toast.success("Journal Posted");
            setDesc('');
            setLines([{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }]);
        } else {
            toast.error(res.error || "Failed to post journal");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Journal Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label>Description / Narration</Label>
                        <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Purchase of office supplies" />
                    </div>
                </div>

                <div className="border rounded-md p-4 space-y-2">
                    <div className="flex justify-between items-center mb-2">
                        <Label>Journal Lines</Label>
                        <Button variant="outline" size="sm" onClick={addLine}>Add Line</Button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground mb-2">
                        <div className="col-span-5">Account</div>
                        <div className="col-span-3">Debit</div>
                        <div className="col-span-3">Credit</div>
                        <div className="col-span-1"></div>
                    </div>

                    {lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <Select value={line.account_id} onValueChange={v => updateLine(index, 'account_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent>
                                        {coa.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <Input type="number" value={line.debit} onChange={e => updateLine(index, 'debit', parseFloat(e.target.value))} />
                            </div>
                            <div className="col-span-3">
                                <Input type="number" value={line.credit} onChange={e => updateLine(index, 'credit', parseFloat(e.target.value))} />
                            </div>
                            <div className="col-span-1">
                                <Button variant="ghost" size="icon" onClick={() => removeLine(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <div className="grid grid-cols-12 gap-2 mt-4 pt-4 border-t font-bold">
                        <div className="col-span-5 text-right pr-4">Total</div>
                        <div className="col-span-3">{totalDebit}</div>
                        <div className="col-span-3">{totalCredit}</div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSubmit}>Post Journal</Button>
                </div>
            </CardContent>
        </Card>
    );
}
