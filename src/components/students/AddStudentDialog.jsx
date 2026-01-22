import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { fetchDepartments } from '@/services/departments';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function AddStudentDialog({
    open,
    onOpenChange,
    onSuccess,
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [password, setPassword] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    useEffect(() => {
        if (open) {
            loadDepartments();
            // Reset form
            setName('');
            setEmail('');
            setDepartmentId('');
            setPassword('');
        }
    }, [open]);

    const loadDepartments = async () => {
        try {
            setLoadingDepartments(true);
            const depts = await fetchDepartments();
            setDepartments(depts);
        } catch (error) {
            console.error('Error loading departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setLoadingDepartments(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!departmentId) {
            toast.error('Please select a department');
            return;
        }

        try {
            setLoading(true);
            const userData = {
                name,
                email,
                password,
                role: 'student',
                department_id: departmentId,
                status: 'active'
            };

            const response = await api.createUser(userData);

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success('Student created successfully');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating student:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create student';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                        Create a new student account. They will be able to login with these credentials.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="new-name">Full Name *</Label>
                            <Input
                                id="new-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter full name (e.g. John Doe)"
                                required
                                className="bg-muted/50"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="new-email">Email Address *</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="student@school.edu"
                                required
                                className="bg-muted/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-department">Department *</Label>
                            <Select
                                value={departmentId}
                                onValueChange={setDepartmentId}
                                disabled={loadingDepartments}
                            >
                                <SelectTrigger className="bg-muted/50">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">Initial Password *</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="create secure password"
                                required
                                className="bg-muted/50"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs">
                        <p>Credentials will be active immediately. Please share them securely with the student.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Creating Account...' : 'Create Student Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
