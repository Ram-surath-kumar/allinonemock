import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';
import { FinanceDashboard } from "./finance/FinanceDashboard";
import { FeeManagement } from "./finance/FeeManagement";
import { PaymentCollection } from "./finance/PaymentCollection";
import { Accounting } from "./finance/Accounting";
import { BankManagement } from "./finance/BankManagement";
import { Refunds } from "./finance/Refunds";
import { Reports } from "./finance/Reports";
import { TaxCompliance } from "./finance/TaxCompliance";
import { Reconciliation } from "./finance/Reconciliation";

export function Finance() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
      </div>

      <Tabs value={searchParams.get('tab') || 'dashboard'} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-muted/50 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="tax">Tax & Compliance</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeeManagement />
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <PaymentCollection />
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          <Accounting />
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <BankManagement />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Refunds />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Reports />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <TaxCompliance />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <Reconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
