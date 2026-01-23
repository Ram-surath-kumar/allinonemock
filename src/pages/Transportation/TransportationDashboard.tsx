import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RouteRegistry } from "./components/RouteRegistry";
import { StudentEnrollment } from "./components/StudentEnrollment";
import { Bus, UserPlus } from "lucide-react";

export default function TransportationDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Transportation Management
        </h1>
        <p className="text-muted-foreground">
          Manage routes, vehicle fleet, and student transport enrollment.
        </p>
      </div>

      <Tabs defaultValue="registry" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="registry" className="gap-2">
            <Bus className="h-4 w-4" />
            Route Registry
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Enrollment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-4 outline-none">
          <RouteRegistry />
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4 outline-none">
          <StudentEnrollment />
        </TabsContent>
      </Tabs>
    </div>
  );
}
