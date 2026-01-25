import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Users, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export function StudentAllocation({ onUpdate }) {
    const [routes, setRoutes] = useState([]);
    const [students, setStudents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);

    const [routeStops, setRouteStops] = useState([]);
    const [showAllocationsDialog, setShowAllocationsDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        student_id: '',
        route_id: '',
        vehicle_id: '', // New field
        pickup_stop_name: '',
        fee_annual: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [routesRes, studentsRes] = await Promise.all([
                api.get('/transport/routes'),
                api.getUsers({ role: 'student' })
            ]);

            console.log('StudentAllocation: routesRes', routesRes);
            console.log('StudentAllocation: studentsRes', studentsRes);

            if (routesRes.data) {
                console.log('StudentAllocation: Setting routes', routesRes.data);
                setRoutes(routesRes.data);
                // Fetch registrations for each route
                await fetchAllRegistrations(routesRes.data);
            } else if (routesRes.error) {
                console.error('StudentAllocation: API Error routes', routesRes.error);
                toast.error(`Failed to load routes: ${routesRes.error}`);
            }

            if (studentsRes.data) {
                setStudents(studentsRes.data);
            } else if (studentsRes.error) {
                console.error('StudentAllocation: API Error students', studentsRes.error);
                toast.error(`Failed to load students: ${studentsRes.error}`);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllRegistrations = async (routesList) => {
        try {
            const allRegistrations = [];
            for (const route of routesList) {
                const response = await api.get(`/transport/route/${route.id}/students`);
                if (response.data) {
                    allRegistrations.push(...response.data.map(reg => ({ ...reg, route_id: route.id })));
                }
            }
            setRegistrations(allRegistrations);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            // Don't show error toast for this as it's a background operation
        }
    };

    const handleAllocate = async (route) => {
        setSelectedRoute(route);
        setFormData({
            student_id: '',
            route_id: route.id,
            vehicle_id: '', // Reset
            pickup_stop_name: '',
            fee_annual: 0
        });

        // Fetch stops for this route
        try {
            const response = await api.get(`/transport/routes/${route.id}/stops`);
            if (response.data) {
                setRouteStops(response.data);
            } else {
                setRouteStops([]);
            }
        } catch (error) {
            console.error('Error fetching route stops:', error);
            setRouteStops([]);
        }

        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/transport/register', formData);
            if (response.data) {
                toast.success('Student allocated to route successfully');
                setIsDialogOpen(false);
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to allocate student');
            }
        } catch (error) {
            console.error('Error allocating student:', error);
            toast.error('An error occurred');
        }
    };

    const handleRemove = async (registrationId) => {
        if (!confirm('Remove student from this route?')) return;

        try {
            const response = await api.delete(`/transport/registrations/${registrationId}`);
            if (response.data) {
                toast.success('Student removed from route');
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to remove student');
            }
        } catch (error) {
            console.error('Error removing student:', error);
            toast.error('An error occurred');
        }
    };

    const getStudentsForRoute = (routeId) => {
        return registrations.filter(reg => reg.route_id === routeId);
    };

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown Student';
    };

    const getRouteName = (routeId) => {
        const route = routes.find(r => r.id === routeId);
        return route ? route.route_name : 'Unknown Route';
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-8">Loading allocations...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Student Route Allocation</h3>
                    <p className="text-sm text-muted-foreground">
                        Assign students to transport routes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                        if (!confirm("This will calculate and assign fees to all currently allocated students who have no fee records. Continue?")) return;
                        const res = await api.syncTransportFees();
                        if (res.data) toast.success(res.data.message);
                        else toast.error("Failed to sync fees");
                    }}>
                        Sync Fees
                    </Button>
                    <Button variant="outline" onClick={() => setShowAllocationsDialog(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        View All Allocations
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routes.map((route) => {
                    const routeStudents = getStudentsForRoute(route.id);

                    return (
                        <Card key={route.id}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-lg">{route.route_name}</h4>
                                        <p className="text-sm text-muted-foreground">{route.route_code}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAllocate(route)}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Student
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-muted-foreground">Allocated Students:</span>
                                        <span className="font-bold">{routeStudents.length}</span>
                                    </div>

                                    {routeStudents.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {routeStudents.map((registration) => (
                                                <div
                                                    key={registration.id}
                                                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {getStudentName(registration.student_id)}
                                                        </p>
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            {registration.pickup_stop_name && (
                                                                <span>Stop: {registration.pickup_stop_name}</span>
                                                            )}
                                                            {/* Optionally show vehicle if available in data */}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemove(registration.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">
                                            No students allocated to this route
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {routes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No routes available. Create routes first to allocate students.</p>
                    </div>
                )}
            </div>

            {/* Allocation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Allocate Student to Route</DialogTitle>
                        <DialogDescription>
                            Assign a student to {selectedRoute?.route_name}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="student">Select Student *</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <select
                                id="student"
                                required
                                className="w-full p-2 border rounded-md max-h-40 overflow-y-auto"
                                value={formData.student_id}
                                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            >
                                <option value="">Select a student</option>
                                {filteredStudents.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>


                        {/* Vehicle Selection - Only show vehicles for this route */}
                        <div className="space-y-2">
                            <Label htmlFor="vehicle">Select Vehicle</Label>
                            <select
                                id="vehicle"
                                className="w-full p-2 border rounded-md"
                                value={formData.vehicle_id}
                                onChange={(e) => {
                                    const vehicleId = e.target.value;
                                    let fee = 0;

                                    // Find selected vehicle to get type
                                    const vehicle = selectedRoute?.vehicles?.find(v => v.id === vehicleId) ||
                                        (selectedRoute?.vehicle?.id === vehicleId ? selectedRoute.vehicle : null);

                                    if (vehicle) {
                                        const type = vehicle.vehicle_type?.toLowerCase() || '';
                                        if (type.includes('bus')) fee = 50000;
                                        else if (type.includes('van')) fee = 40000;
                                        else if (type.includes('tempo')) fee = 30000;
                                        else if (type.includes('car')) fee = 20000;
                                    }

                                    setFormData({
                                        ...formData,
                                        vehicle_id: vehicleId,
                                        fee_annual: fee
                                    });
                                }}
                            >
                                <option value="">Any / Not Assigned</option>
                                {selectedRoute?.vehicles?.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.registration_number} ({vehicle.vehicle_type})
                                    </option>
                                ))}
                                {/* Backward compatibility check */}
                                {!selectedRoute?.vehicles?.length && selectedRoute?.vehicle && (
                                    <option value={selectedRoute.vehicle.id}>
                                        {selectedRoute.vehicle.registration_number}
                                    </option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pickup_stop">Pickup Stop *</Label>
                            <select
                                id="pickup_stop"
                                required
                                className="w-full p-2 border rounded-md"
                                value={formData.pickup_stop_name}
                                onChange={(e) => setFormData({ ...formData, pickup_stop_name: e.target.value })}
                                title="Select pickup stop"
                            >
                                <option value="">Select a pickup stop</option>
                                {routeStops.map((stop, idx) => (
                                    <option key={idx} value={stop.stop_name}>
                                        {stop.stop_name} {stop.arrival_time && `(${stop.arrival_time})`}
                                    </option>
                                ))}
                            </select>
                            {routeStops.length === 0 && (
                                <p className="text-xs text-amber-600">
                                    No stops defined for this route. Please add stops in Route Management.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fee">Annual Fee (₹)</Label>
                            <Input
                                id="fee"
                                type="number"
                                min="0"
                                value={formData.fee_annual}
                                onChange={(e) => setFormData({ ...formData, fee_annual: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Allocate Student</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View All Allocations Dialog */}
            <Dialog open={showAllocationsDialog} onOpenChange={setShowAllocationsDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>All Allocated Students</DialogTitle>
                        <DialogDescription>
                            List of all students currently assigned to transport routes
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b">
                                    <th className="h-10 px-4 text-left align-middle font-medium">Student</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">Route</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium">Stop</th>
                                    <th className="h-10 px-4 text-right align-middle font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                            No allocations found
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.map((reg) => (
                                        <tr key={reg.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{getStudentName(reg.student_id)}</div>
                                            </td>
                                            <td className="p-4 align-middle">{getRouteName(reg.route_id)}</td>
                                            <td className="p-4 align-middle">{reg.pickup_stop_name || '-'}</td>
                                            <td className="p-4 align-middle text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemove(reg.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
