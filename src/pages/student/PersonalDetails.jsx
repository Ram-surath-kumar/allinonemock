import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Building2, Edit2, Save, X, Home, Users, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PersonalDetails() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Basic
    name: '',
    email: '',
    collegeEmail: '',
    phone: '',
    altMobile: '',
    landline: '',

    // Academic
    studentId: '',
    department: '',
    year: '',
    semester: '',
    section: '',
    admissionDate: '',

    // Personal
    dateOfBirth: '',
    gender: '',
    category: '',
    religion: '',
    nationality: '',
    bloodGroup: '',
    motherTongue: '',
    pwdStatus: false,

    // Address - Current
    currentStreet: '',
    currentCity: '',
    currentState: '',
    currentPincode: '',
    currentCountry: '',

    // Address - Permanent
    permanentStreet: '',
    permanentCity: '',
    permanentState: '',
    permanentPincode: '',
    permanentCountry: '',

    // Family
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    familyIncome: '',

    // Identity
    aadharNo: '',
    panNo: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadPersonalDetails();
    }
  }, [currentUser]);

  const loadPersonalDetails = async () => {
    try {
      setLoading(true);
      // Fetch detailed user information & SIS Profile
      if (currentUser?.id) {
        const [userResponse, profileResponse] = await Promise.all([
          api.getUserById(currentUser.id),
          api.getStudentProfile(currentUser.id)
        ]);

        if (userResponse.error) throw new Error(userResponse.error);

        const data = userResponse.data;
        const profile = profileResponse.data || {};

        if (data) {
          setFormData({
            // Basic
            name: data.name || '',
            email: data.email || '',
            collegeEmail: profile.college_email || '',
            phone: data.phone || data.contact_number || '',
            altMobile: profile.alt_mobile || '',
            landline: profile.landline_phone || '',

            // Academic
            dateOfBirth: profile.dob || data.date_of_birth || data.dob || '',
            admissionDate: profile.enrollment_date || data.admission_date || '',
            studentId: profile.student_id_no || data.student_id || data.user_id?.toString() || '',
            department: data.department || '',
            year: data.year || '',
            semester: data.semester || '',
            section: profile.section || '',

            // Personal
            gender: profile.gender || '',
            category: profile.category || '',
            religion: profile.religion || '',
            nationality: profile.nationality || '',
            bloodGroup: profile.blood_group || '',
            motherTongue: profile.mother_tongue || '',
            pwdStatus: profile.pwd_status || false,

            // Current Address
            currentStreet: profile.current_street || '',
            currentCity: profile.current_city || '',
            currentState: profile.current_state || '',
            currentPincode: profile.current_pincode || '',
            currentCountry: profile.current_country || '',

            // Permanent Address
            permanentStreet: profile.permanent_street || '',
            permanentCity: profile.permanent_city || '',
            permanentState: profile.permanent_state || '',
            permanentPincode: profile.permanent_pincode || '',
            permanentCountry: profile.permanent_country || '',

            // Family
            fatherName: profile.father_name || '',
            fatherOccupation: profile.father_occupation || '',
            motherName: profile.mother_name || '',
            motherOccupation: profile.mother_occupation || '',
            familyIncome: profile.family_annual_income || '',

            // Identity
            aadharNo: profile.aadhar_no || '',
            panNo: profile.pan_no || '',
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

      // 1. Update basic user info
      const userUpdateResponse = await api.updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        // user table usually holds summary address
        address: `${formData.currentCity}, ${formData.currentState}`
      });

      if (userUpdateResponse.error) throw new Error(userUpdateResponse.error);

      // 2. Update SIS Profile info
      const profileData = {
        alt_mobile: formData.altMobile,
        landline_phone: formData.landline,
        dob: formData.dateOfBirth,

        gender: formData.gender,
        category: formData.category,
        religion: formData.religion,
        nationality: formData.nationality,
        blood_group: formData.bloodGroup,
        mother_tongue: formData.motherTongue,
        pwd_status: formData.pwdStatus,

        current_street: formData.currentStreet,
        current_city: formData.currentCity,
        current_state: formData.currentState,
        current_pincode: formData.currentPincode,
        current_country: formData.currentCountry,

        permanent_street: formData.permanentStreet,
        permanent_city: formData.permanentCity,
        permanent_state: formData.permanentState,
        permanent_pincode: formData.permanentPincode,
        permanent_country: formData.permanentCountry,

        father_name: formData.fatherName,
        father_occupation: formData.fatherOccupation,
        mother_name: formData.motherName,
        mother_occupation: formData.motherOccupation,
        family_annual_income: formData.familyIncome,

        aadhar_no: formData.aadharNo,
        pan_no: formData.panNo,
      };

      const profileUpdateResponse = await api.updateStudentProfile(currentUser.id, profileData);

      if (profileUpdateResponse.error) throw new Error(profileUpdateResponse.error);

      toast.success('Profile updated successfully');
      setEditing(false);
      await loadPersonalDetails();
    } catch (error) {
      console.error('Error updating details:', error);
      toast.error(error.message || 'Failed to update details');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    loadPersonalDetails();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const renderField = (label, valueKey, icon, type = "text") => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-muted-foreground">
        {icon && <icon.type {...icon.props} className="h-4 w-4" />}
        {label}
      </Label>
      {editing ? (
        <Input
          type={type}
          value={formData[valueKey]}
          onChange={(e) => setFormData({ ...formData, [valueKey]: e.target.value })}
        />
      ) : (
        <p className="font-medium">{formData[valueKey] || '-'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Profile</h2>
          <p className="text-muted-foreground">View and manage your complete student record</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="ghost" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Basic & Identity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic & Identity Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Full Name</Label>
              {editing ? (
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              ) : <p className="font-medium">{formData.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              {editing ? (
                <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              ) : <p className="font-medium">{formData.dateOfBirth}</p>}
            </div>

            {renderField("Gender", "gender", null)}
            {renderField("Blood Group", "bloodGroup", null)}
            {renderField("Category", "category", null)}
            {renderField("Religion", "religion", null)}
            {renderField("Nationality", "nationality", null)}
            {renderField("Mother Tongue", "motherTongue", null)}
            {renderField("Aadhaar Number", "aadharNo", <CreditCard />)}
          </CardContent>
        </Card>

        {/* 2. Academic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Student ID</Label>
                <p className="font-semibold text-lg">{formData.studentId || 'Not Assigned'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Department</Label>
                <p className="font-medium">{formData.department}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Admission Date</Label>
                <p className="font-medium">{formData.admissionDate}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">College Email</Label>
                <p className="font-medium text-blue-600">{formData.collegeEmail || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Current Semester</Label>
                <p className="font-medium">{formData.semester && `Sem ${formData.semester}`} {formData.section && `(Sec ${formData.section})`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderField("Personal Email", "email", <Mail />)}
            {renderField("Personal Mobile", "phone", <Phone />)}
            {renderField("Alternative Mobile", "altMobile", <Phone />)}
            {renderField("Landline", "landline", <Phone />)}
          </CardContent>
        </Card>

        {/* 4. Family Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {renderField("Father's Name", "fatherName", null)}
            {renderField("Father's Occupation", "fatherOccupation", null)}
            {renderField("Mother's Name", "motherName", null)}
            {renderField("Mother's Occupation", "motherOccupation", null)}
            {renderField("Annual Income", "familyIncome", null)}
          </CardContent>
        </Card>

        {/* 5. Address */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">Current Address</h4>
              {renderField("Street/Area", "currentStreet", null)}
              {renderField("City", "currentCity", null)}
              {renderField("State", "currentState", null)}
              {renderField("Pincode", "currentPincode", null)}
              {renderField("Country", "currentCountry", null)}
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">Permanent Address</h4>
              {renderField("Street/Area", "permanentStreet", null)}
              {renderField("City", "permanentCity", null)}
              {renderField("State", "permanentState", null)}
              {renderField("Pincode", "permanentPincode", null)}
              {renderField("Country", "permanentCountry", null)}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
