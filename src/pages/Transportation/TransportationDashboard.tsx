import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, MapPin } from 'lucide-react';

export default function TransportationDashboard() {
    const [activeTab, setActiveTab] = useState('enrollment');

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transportation Management</h1>
                    <p className="text-muted-foreground">Manage student transport enrollment and route registry.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="enrollment">
                        <Bus className="mr-2 h-4 w-4" />
                        Student Transport Enrollment
                    </TabsTrigger>
                    <TabsTrigger value="routes">
                        <MapPin className="mr-2 h-4 w-4" />
                        Route Registry
                    </TabsTrigger>
                </TabsList>

                {/* Student Transport Enrollment Tab */}
                <TabsContent value="enrollment" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Transport Enrollment</CardTitle>
                            <CardDescription>
                                Manage student transportation assignments and enrollment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <Bus className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Student transport enrollment features coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Route Registry Tab */}
                <TabsContent value="routes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Route Registry</CardTitle>
                            <CardDescription>
                                View and manage transportation routes and schedules.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Route registry features coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
