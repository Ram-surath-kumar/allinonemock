import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AddVehicleDialog({ open, onOpenChange, onSaved }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        vehicle_type: 'Bus',
        registration_number: '',
        registration_date: '',
        renewal_date: '',
        expiry_date: '',
        make_model: '',
        year_of_manufacture: new Date().getFullYear(),
        engine_type: 'Diesel',
        seating_capacity: '',
        chassis_number: '',
        engine_number: '',
        color: '',
        current_odometer_reading: 0,
        fuel_tank_capacity: '',
        owner_name: 'College',
        ownership_type: 'Owned',
        status: 'Active'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean up the data - convert empty strings to null for both date and numeric fields
            const cleanedData = {
                ...formData,
                // Date fields - convert empty strings to null
                registration_date: formData.registration_date === '' ? null : formData.registration_date,
                renewal_date: formData.renewal_date === '' ? null : formData.renewal_date,
                expiry_date: formData.expiry_date === '' ? null : formData.expiry_date,
                purchase_date: formData.purchase_date === '' ? null : formData.purchase_date,

                // Numeric fields - convert empty strings to null or 0
                seating_capacity: formData.seating_capacity === '' ? null : parseInt(formData.seating_capacity),
                year_of_manufacture: formData.year_of_manufacture === '' ? null : parseInt(formData.year_of_manufacture),
                fuel_tank_capacity: formData.fuel_tank_capacity === '' ? null : parseFloat(formData.fuel_tank_capacity),
                current_odometer_reading: formData.current_odometer_reading === '' ? 0 : parseFloat(formData.current_odometer_reading),
                purchase_cost: formData.purchase_cost === '' ? null : parseFloat(formData.purchase_cost),
                monthly_lease_cost: formData.monthly_lease_cost === '' ? null : parseFloat(formData.monthly_lease_cost)
            };

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/transport/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData)
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Vehicle added successfully");
                onSaved();
                onOpenChange(false);
                setFormData({
                    vehicle_id: '',
                    vehicle_type: 'Bus',
                    registration_number: '',
                    registration_date: '',
                    renewal_date: '',
                    expiry_date: '',
                    make_model: '',
                    year_of_manufacture: new Date().getFullYear(),
                    engine_type: 'Diesel',
                    seating_capacity: '',
                    chassis_number: '',
                    engine_number: '',
                    color: '',
                    current_odometer_reading: 0,
                    fuel_tank_capacity: '',
                    owner_name: 'College',
                    ownership_type: 'Owned',
                    status: 'Active'
                });
            } else {
                toast.error(result.message || "Failed to add vehicle");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>Enter the mandatory vehicle registration and identification details.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Vehicle ID (e.g., VEH-BUS-001)</Label>
                        <Input
                            required
                            placeholder="VEH-BUS-001"
                            value={formData.vehicle_id}
                            onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Vehicle Type</Label>
                        <Select
                            value={formData.vehicle_type}
                            onValueChange={v => setFormData({ ...formData, vehicle_type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Bus">Bus (40-50 seater)</SelectItem>
                                <SelectItem value="Van">Van (10-15 seater)</SelectItem>
                                <SelectItem value="Tempo">Tempo (8-10 seater)</SelectItem>
                                <SelectItem value="Car">Car (2-4 seater)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Registration Number</Label>
                        <Input
                            required
                            placeholder="MH01AB1234"
                            value={formData.registration_number}
                            onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Registration Date</Label>
                        <Input
                            type="date"
                            value={formData.registration_date}
                            onChange={e => setFormData({ ...formData, registration_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                            type="date"
                            value={formData.expiry_date}
                            onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Make & Model</Label>
                        <Input
                            placeholder="Tata, Ashok Leyland, etc."
                            value={formData.make_model}
                            onChange={e => setFormData({ ...formData, make_model: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Year of Manufacture</Label>
                        <Input
                            type="number"
                            value={formData.year_of_manufacture}
                            onChange={e => setFormData({ ...formData, year_of_manufacture: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Engine Type</Label>
                        <Select
                            value={formData.engine_type}
                            onValueChange={v => setFormData({ ...formData, engine_type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                                <SelectItem value="Petrol">Petrol</SelectItem>
                                <SelectItem value="CNG">CNG</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Seating Capacity</Label>
                        <Input
                            type="number"
                            value={formData.seating_capacity}
                            onChange={e => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Chassis Number</Label>
                        <Input
                            value={formData.chassis_number}
                            onChange={e => setFormData({ ...formData, chassis_number: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Engine Number</Label>
                        <Input
                            value={formData.engine_number}
                            onChange={e => setFormData({ ...formData, engine_number: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Ownership Type</Label>
                        <Select
                            value={formData.ownership_type}
                            onValueChange={v => setFormData({ ...formData, ownership_type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Owned">Owned (College)</SelectItem>
                                <SelectItem value="Leased">Leased</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2 pt-4">
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Create Vehicle'}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
