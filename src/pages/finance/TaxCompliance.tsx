import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function TaxCompliance() {
    return (
        <div className="space-y-6">
            <Tabs defaultValue="settings">
                <TabsList>
                    <TabsTrigger value="settings">Tax Settings</TabsTrigger>
                    <TabsTrigger value="gst-report">GST Liability Report</TabsTrigger>
                    {/* <TabsTrigger value="tds-report">TDS Report</TabsTrigger> */}
                </TabsList>

                <TabsContent value="settings">
                    <TaxSettings />
                </TabsContent>

                <TabsContent value="gst-report">
                    <GSTReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TaxSettings() {
    const [config, setConfig] = useState({ gst_rate: 18, tds_rate: 10, gst_no: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch config
        api.getTaxConfig().then(res => res.data && setConfig(res.data));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.saveTaxConfig(config);
            toast.success("Tax configuration saved.");
        } catch (e) {
            toast.error("Failed to save settings.");
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>Configure Global Tax Rates for the Institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label>Institution GSTIN</Label>
                    <Input placeholder="e.g. 29AAAAA0000A1Z5" value={config.gst_no} onChange={e => setConfig({ ...config, gst_no: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Default GST Rate (%)</Label>
                    <Input type="number" value={config.gst_rate} onChange={e => setConfig({ ...config, gst_rate: Number(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Applied to taxable regular fees.</p>
                </div>
                <div className="space-y-2">
                    <Label>TDS Rate on Service Payments (%)</Label>
                    <Input type="number" value={config.tds_rate} onChange={e => setConfig({ ...config, tds_rate: Number(e.target.value) })} />
                </div>
                <Button onClick={handleSave} disabled={loading}>Save Configuration</Button>
            </CardContent>
        </Card>
    );
}

function GSTReport() {
    // Mock Data for now
    const [data] = useState([
        { month: 'January', taxable_amount: 500000, gst_collected: 90000 },
        { month: 'February', taxable_amount: 450000, gst_collected: 81000 },
    ]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>GST Output Liability</CardTitle>
                <CardDescription>Monthly GST collected from student fees.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Taxable Amount</TableHead>
                            <TableHead>GST Collected (18%)</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow key={i}>
                                <TableCell>{row.month}</TableCell>
                                <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.taxable_amount)}</TableCell>
                                <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.gst_collected)}</TableCell>
                                <TableCell><span className="text-yellow-600 font-medium">Pending Filing</span></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
