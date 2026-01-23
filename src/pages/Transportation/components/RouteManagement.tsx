import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export function RouteManagement({ onUpdate }) {
    const [routes, setRoutes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [formData, setFormData] = useState({
        route_name: '',
        route_code: '',
        vehicle_id: '',
        departure_time_start: '',
        arrival_time_campus: '',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [routesRes, vehiclesRes] = await Promise.all([
                api.get('/transport/routes'),
                api.get('/transport/vehicles')
            ]);

            if (routesRes.data) setRoutes(routesRes.data);
            if (vehiclesRes.data) setVehicles(vehiclesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoute) {
                // Update route
                const response = await api.put(`/transport/routes/${editingRoute.id}`, formData);
                if (response.data) {
                    toast.success('Route updated successfully');
                } else {
                    toast.error(response.error || 'Failed to update route');
                }
            } else {
                // Create new route
                const response = await api.post('/transport/routes', formData);
                if (response.data) {
                    toast.success('Route created successfully');
                } else {
                    toast.error(response.error || 'Failed to create route');
                }
            }

            setIsDialogOpen(false);
            resetForm();
            fetchData();
            onUpdate?.();
        } catch (error) {
            console.error('Error saving route:', error);
            toast.error('An error occurred');
        }
    };

    const handleEdit = (route) => {
        setEditingRoute(route);
        setFormData({
            route_name: route.route_name || '',
            route_code: route.route_code || '',
            vehicle_id: route.vehicle_id || '',
            departure_time_start: route.departure_time_start || '',
            arrival_time_campus: route.arrival_time_campus || '',
            status: route.status || 'active'
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (routeId) => {
        if (!confirm('Are you sure you want to delete this route?')) return;

        try {
            const response = await api.delete(`/transport/routes/${routeId}`);
            if (response.data) {
                toast.success('Route deleted successfully');
                fetchData();
                onUpdate?.();
            } else {
                toast.error(response.error || 'Failed to delete route');
            }
        } catch (error) {
            console.error('Error deleting route:', error);
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setFormData({
            route_name: '',
            route_code: '',
            vehicle_id: '',
            departure_time_start: '',
            arrival_time_campus: '',
            status: 'active'
        });
        setEditingRoute(null);
    };

    const getVehicleName = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.registration_number : 'Not Assigned';
    };

    if (loading) {
        return <div className="text-center py-8">Loading routes...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Transport Routes</h3>
                <Button onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Route
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => (
                    <Card key={route.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>{route.route_name}</span>
                                <span className={`text-xs px-2 py-1 rounded ${route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {route.status}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm">
                                <span className="font-medium">Code:</span> {route.route_code || 'N/A'}
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">Vehicle:</span> {getVehicleName(route.vehicle_id)}
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">Departure:</span> {route.departure_time_start || 'N/A'}
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">Arrival:</span> {route.arrival_time_campus || 'N/A'}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(route)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(route.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {routes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No routes found. Create your first transport route.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
                        <DialogDescription>
                            {editingRoute ? 'Update route details' : 'Create a new transport route'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="route_name">Route Name *</Label>
                            <Input
                                id="route_name"
                                required
                                value={formData.route_name}
                                onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                                placeholder="e.g., North Campus Route"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="route_code">Route Code</Label>
                            <Input
                                id="route_code"
                                value={formData.route_code}
                                onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                                placeholder="e.g., RT-001"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicle_id">Assign Vehicle</Label>
                            <select
                                id="vehicle_id"
                                className="w-full p-2 border rounded-md"
                                value={formData.vehicle_id}
                                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                            >
                                <option value="">No Vehicle Assigned</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.registration_number} - {vehicle.vehicle_type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="departure_time_start">Departure Time</Label>
                                <Input
                                    id="departure_time_start"
                                    type="time"
                                    value={formData.departure_time_start}
                                    onChange={(e) => setFormData({ ...formData, departure_time_start: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="arrival_time_campus">Arrival Time</Label>
                                <Input
                                    id="arrival_time_campus"
                                    type="time"
                                    value={formData.arrival_time_campus}
                                    onChange={(e) => setFormData({ ...formData, arrival_time_campus: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingRoute ? 'Update' : 'Create'} Route</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
