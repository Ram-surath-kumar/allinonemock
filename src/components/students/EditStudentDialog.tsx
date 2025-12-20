import { useState, useEffect } from 'react';
import { User } from '@/types/erp';
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
import { fetchDepartments, Department } from '@/services/departments';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: User;
  onUpdate: (data: {
    name: string;
    email: string;
    department_id: string;
  }) => void;
}

export function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onUpdate,
}: EditStudentDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (student && open) {
      setName(student.name);
      setEmail(student.email);
      loadStudentDepartment(student.id);
    }
  }, [student, open]);

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

  const loadStudentDepartment = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setDepartmentId(data?.department_id || '');
    } catch (error) {
      console.error('Error loading student department:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!departmentId) {
      toast.error('Please select a department');
      return;
    }

    onUpdate({
      name,
      email,
      department_id: departmentId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student Information</DialogTitle>
          <DialogDescription>
            Update the basic information for this student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.edu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-department">Department *</Label>
            <Select 
              value={departmentId} 
              onValueChange={setDepartmentId}
              disabled={loadingDepartments}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

