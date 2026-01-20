import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Building, DoorOpen, Wrench, AlertTriangle,
    PieChart, Activity, CheckCircle2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

export function FacilitiesDashboard({ hierarchy }) {
    // Calculate stats from hierarchy
    const stats = useMemo(() => {
        let totalBuildings = hierarchy.length;
        let totalRooms = 0;
        let pendingRepairs = 0;
        let totalCapacity = 0;

        const roomTypes = {};
        const roomStatus = {};

        hierarchy.forEach(bld => {
            bld.floors.forEach(floor => {
                floor.rooms.forEach(room => {
                    totalRooms++;
                    totalCapacity += (room.capacity || 0);

                    // Room Types
                    const type = room.room_type || 'Other';
                    roomTypes[type] = (roomTypes[type] || 0) + 1;

                    // Status
                    const status = room.status || 'Active';
                    roomStatus[status] = (roomStatus[status] || 0) + 1;

                    // Maintenance
                    if (room.maintenance?.repairs_pending) {
                        pendingRepairs++;
                    }
                });
            });
        });

        const typeData = Object.entries(roomTypes).map(([name, value]) => ({ name, value }));
        const statusData = Object.entries(roomStatus).map(([name, value]) => ({ name, value }));

        return {
            totalBuildings,
            totalRooms,
            pendingRepairs,
            totalCapacity,
            typeData,
            statusData
        };
    }, [hierarchy]);

    if (!hierarchy || hierarchy.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 select-none">
                <Building className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No Facilities Data</h3>
                <p className="text-sm max-w-sm text-center mt-2">
                    Start by adding a building to the system.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBuildings}</div>
                        <p className="text-xs text-muted-foreground">Across all campuses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRooms}</div>
                        <p className="text-xs text-muted-foreground">Total Capacity: {stats.totalCapacity}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
                        <Wrench className={stats.pendingRepairs > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingRepairs}</div>
                        <p className="text-xs text-muted-foreground">Rooms needing repairs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Operational Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(((stats.statusData.find(s => s.name === 'Active')?.value || 0) / stats.totalRooms) * 100) || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Rooms Active</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-[300px]">
                    <CardHeader>
                        <CardTitle>Rooms by Type</CardTitle>
                        <CardDescription>Distribution of room categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.typeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis title="Count" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="h-[300px]">
                    <CardHeader>
                        <CardTitle>Room Status</CardTitle>
                        <CardDescription>Current operational status.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.statusData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates to facilities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">Maintenance Logged</p>
                                        <p className="text-sm text-muted-foreground">Room 101 - AC Repair</p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">Today</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
