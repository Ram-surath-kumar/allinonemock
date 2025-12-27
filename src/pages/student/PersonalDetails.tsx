import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Building2, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PersonalDetails() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    admissionDate: '',
    studentId: '',
    department: '',
    year: '',
    semester: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadPersonalDetails();
    }
  }, [currentUser]);

  const loadPersonalDetails = async () => {
    try {
      setLoading(true);
      // Fetch detailed user information
      if (currentUser?.id) {
        const response = await api.getUserById(currentUser.id);
        if (response.error) throw new Error(response.error);
        
        const data = response.data as any;
        if (data) {
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || data.contact_number || '',
            address: data.address || '',
            dateOfBirth: data.date_of_birth || data.dob || '',
            admissionDate: data.admission_date || '',
            studentId: data.student_id || data.user_id?.toString() || '',
            department: data.department || '',
            year: data.year || '',
            semester: data.semester || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading personal details:', error);
      toast.error('Failed to load personal details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!currentUser?.id) return;

      const response = await api.updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.dateOfBirth,
      });

      if (response.error) throw new Error(response.error);

      toast.success('Personal details updated successfully');
      setEditing(false);
      await loadPersonalDetails();
    } catch (error: any) {
      console.error('Error updating personal details:', error);
      toast.error(error.message || 'Failed to update personal details');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    loadPersonalDetails();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header Card */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Personal Details</CardTitle>
            <CardDescription>View and manage your personal information</CardDescription>
          </div>
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.name || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.email || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  {editing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.phone || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  {editing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Academic Information</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student ID
                  </Label>
                  <p className="text-sm font-medium">{formData.studentId || 'Not assigned'}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </Label>
                  <p className="text-sm font-medium">{formData.department || currentUser?.department || 'Not assigned'}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Admission Date
                  </Label>
                  <p className="text-sm font-medium">
                    {formData.admissionDate ? new Date(formData.admissionDate).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>

                {formData.year && (
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <p className="text-sm font-medium">{formData.year}</p>
                  </div>
                )}

                {formData.semester && (
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <p className="text-sm font-medium">{formData.semester}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

