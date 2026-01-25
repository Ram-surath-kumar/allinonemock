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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Reports() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="collection">
        <TabsList>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          <TabsTrigger value="financials">Financial Statements</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="collection">
          <CollectionReport />
        </TabsContent>
        <TabsContent value="outstanding">
          <OutstandingReport />
        </TabsContent>
        <TabsContent value="scholarships">
          <ScholarshipReport />
        </TabsContent>
        <TabsContent value="financials">
          <FinancialStatementReport />
        </TabsContent>
        <TabsContent value="advanced">
          <AdvancedReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { RippleLoader } from "@/components/ui/RippleLoader";
import { useFinance } from "@/contexts/FinanceContext";

function CollectionReport() {
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useFinance();

  const loadReport = async () => {
    setLoading(true);
    const res = await api.getCollectionReport({ start_date: startDate, end_date: endDate });
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [refreshTrigger]);

  // Transform data for chart
  const chartData = data
    ? Object.keys(data)
      .filter((k) => k !== "total" && k !== "transactions")
      .map((method) => ({ method: method.replace("_", " "), amount: data[method] }))
    : [];

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 border p-4 rounded-lg bg-card">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={loadReport} disabled={loading}>
          Generate Report
        </Button>
      </div>

      {
        loading ? (
          <div className="min-h-[400px]">
            <RippleLoader />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4 h-fit">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
                      data.total || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              {chartData.map((item) => (
                <Card key={item.method}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize">{item.method}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
                        item.amount
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Collection by Method</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="method"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No data available. Please generate the report.
          </div>
        )
      }
    </div >
  );
}

function AdvancedReports() {
  // Mock Data for Cash Flow
  const cashFlowData = [
    { month: "Jan", inflow: 120000, outflow: 80000 },
    { month: "Feb", inflow: 150000, outflow: 90000 },
    { month: "Mar", inflow: 180000, outflow: 120000 },
    { month: "Apr", inflow: 100000, outflow: 110000 },
    { month: "May", inflow: 200000, outflow: 95000 },
    { month: "Jun", inflow: 170000, outflow: 100000 },
  ];

  const chartConfig = {
    inflow: { label: "Inflow", color: "#2563eb" },
    outflow: { label: "Outflow", color: "#64748b" },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Monthly Inflow vs Outflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={cashFlowData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="inflow" fill="var(--color-inflow)" radius={4} name="Inflow" />
                <Bar dataKey="outflow" fill="var(--color-outflow)" radius={4} name="Outflow" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bad Debt Provision</CardTitle>
            <CardDescription>Students with fees overdue &gt; 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Rahul Sharma</TableCell>
                  <TableCell className="text-red-600 font-bold">₹25,000</TableCell>
                  <TableCell>195 days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sneha Gupta</TableCell>
                  <TableCell className="text-red-600 font-bold">₹12,500</TableCell>
                  <TableCell>210 days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Priya Singh</TableCell>
                  <TableCell className="text-red-600 font-bold">₹40,000</TableCell>
                  <TableCell>182 days</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OutstandingReport() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOutstandingFees().then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  const totalOutstanding = data.reduce(
    (sum, item) => sum + (item.net_amount - (item.paid_amount || 0)),
    0
  );

  if (loading) return <RippleLoader />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Fees (Total: {totalOutstanding})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.student?.name} ({item.student?.loopid})
                </TableCell>
                <TableCell>{item.structure?.name}</TableCell>
                <TableCell>{item.net_amount}</TableCell>
                <TableCell>{item.paid_amount}</TableCell>
                <TableCell className="text-red-500 font-bold">
                  {item.net_amount - (item.paid_amount || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ScholarshipReport() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getScholarshipReport().then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  const totalDiscount = data.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

  if (loading) return <RippleLoader />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scholarships Awarded (Value: {totalDiscount})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Scholarship</TableHead>
              <TableHead>Discount Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.student?.name}</TableCell>
                <TableCell>{item.scholarship?.name}</TableCell>
                <TableCell>{item.discount_amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FinancialStatementReport() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getFinancialStatements().then((res) => res.data && setData(res.data));
  }, []);

  // Removed nested import

  if (!data) return <RippleLoader />;

  const assets = data["asset"] || 0;
  const liabilities = data["liability"] || 0;
  const equity = data["equity"] || 0;
  const income = data["income"] || 0;
  const expense = data["expense"] || 0;
  const profit = income - expense;

  return (
    <div className="grid grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span>Assets</span>
            <span className="font-bold">{assets}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Liabilities</span>
            <span className="font-bold">{liabilities}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Equity</span>
            <span className="font-bold">{equity}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span>Total (L+E)</span>
            <span className="font-bold">{liabilities + equity}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span>Income</span>
            <span className="font-bold">{income}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Expense</span>
            <span className="font-bold">{expense}</span>
          </div>
          <div className="flex justify-between pt-2 text-lg">
            <span>Net Profit</span>
            <span className={profit >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {profit}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
