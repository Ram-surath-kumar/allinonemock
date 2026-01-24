import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, Route, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { RouteManagement } from './components/RouteManagement';
import { VehicleAssignment } from './components/VehicleAssignment';
import { StudentAllocation } from './components/StudentAllocation';

export default function Transportation() {
    const [activeTab, setActiveTab] = useState('routes');
    const [stats, setStats] = useState({
        totalRoutes: 0,
        totalVehicles: 0,
        totalStudents: 0,
        activeRoutes: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch routes
            const routesResponse = await api.get('/transport/routes');
            const routes = routesResponse.data || [];

            // Fetch vehicles
            const vehiclesResponse = await api.get('/transport/vehicles');
            const vehicles = vehiclesResponse.data || [];

            // Fetch students (registrations)
            const studentsResponse = await api.get('/transport/registrations');
            const students = studentsResponse.data || [];

            setStats({
                totalRoutes: routes.length,
                totalVehicles: vehicles.length,
                totalStudents: students.length,
                activeRoutes: routes.filter(r => r.status === 'active').length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transportation Management</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage routes, assign vehicles, and allocate students to transport services
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Routes</p>
                                <h3 className="text-2xl font-bold">{stats.totalRoutes}</h3>
                            </div>
                            <Route className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Vehicles</p>
                                <h3 className="text-2xl font-bold">{stats.totalVehicles}</h3>
                            </div>
                            <Bus className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Students</p>
                                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                            </div>
                            <Users className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Routes</p>
                                <h3 className="text-2xl font-bold">{stats.activeRoutes}</h3>
                            </div>
                            <Route className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Card className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="routes" className="flex items-center gap-2">
                                <Route className="h-4 w-4" />
                                Route Management
                            </TabsTrigger>
                            <TabsTrigger value="vehicles" className="flex items-center gap-2">
                                <Bus className="h-4 w-4" />
                                Vehicle Assignment
                            </TabsTrigger>
                            <TabsTrigger value="students" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Student Allocation
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-auto pt-6">
                        <TabsContent value="routes" className="mt-0 h-full">
                            <RouteManagement onUpdate={fetchStats} />
                        </TabsContent>

                        <TabsContent value="vehicles" className="mt-0 h-full">
                            <VehicleAssignment onUpdate={fetchStats} />
                        </TabsContent>

                        <TabsContent value="students" className="mt-0 h-full">
                            <StudentAllocation onUpdate={fetchStats} />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
