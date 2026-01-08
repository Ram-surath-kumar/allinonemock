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
        
        const data = response.data;
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
    } catch (error) {
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
      
        
        
      
    );
  }

  return (
    
      {/* Header Card */}
      
        
          
            Personal Details
            View and manage your personal information
          
          {!editing ? (
             setEditing(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              
              Edit
            
          ) : (
            
              
                
                Save
              
              
                
                Cancel
              
            
          )}
        
        
          
            {/* Basic Information */}
            
              Basic Information
              
              
                
                  
                    
                    Full Name
                  
                  {editing ? (
                     setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    {formData.name || 'Not provided'}
                  )}
                

                
                  
                    
                    Email Address
                  
                  {editing ? (
                     setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    {formData.email || 'Not provided'}
                  )}
                

                
                  
                    
                    Phone Number
                  
                  {editing ? (
                     setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    {formData.phone || 'Not provided'}
                  )}
                

                
                  
                    
                    Address
                  
                  {editing ? (
                     setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    {formData.address || 'Not provided'}
                  )}
                
              
            

            {/* Academic Information */}
            
              Academic Information
              
              
                
                  
                    
                    Student ID
                  
                  {formData.studentId || 'Not assigned'}
                

                
                  
                    
                    Department
                  
                  {formData.department || currentUser?.department || 'Not assigned'}
                

                
                  
                    
                    Date of Birth
                  
                  {editing ? (
                     setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    
                      {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    
                  )}
                

                
                  
                    
                    Admission Date
                  
                  
                    {formData.admissionDate ? new Date(formData.admissionDate).toLocaleDateString() : 'Not provided'}
                  
                

                {formData.year && (
                  
                    Year
                    {formData.year}
                  
                )}

                {formData.semester && (
                  
                    Semester
                    {formData.semester}
                  
                )}
              
            
          
        
      
    
  );
}

