import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Phone, MapPin, Mail, Briefcase, Building } from "lucide-react";

export const ProfileSettings = ({ currentUser }) => {
  const { currentUser: authCurrentUser, refreshUser } = useAuth();
  const { t } = useI18n();
  // Local state for editable fields
  // Initialize with current user data or empty strings
  const [formData, setFormData] = useState({
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    bio: currentUser?.bio || "",
    emergency_contact: currentUser?.emergency_contact || "",
    dob: currentUser?.dob || "",
    gender: currentUser?.gender || "",
    blood_group: currentUser?.blood_group || "",
  });

  // Non-editable fields for display
  const [displayData, setDisplayData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    role: currentUser?.role || "",
    department: currentUser?.department || "",
    designation: currentUser?.designation || currentUser?.role || "", // Fallback to role if designation not set
  });

  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(null);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.dob]);

  // Update state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        bio: currentUser.bio || "",
        emergency_contact: currentUser.emergency_contact || "",
        dob: currentUser.dob || "",
        gender: currentUser.gender || "",
        blood_group: currentUser.blood_group || "",
      });
      setDisplayData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        role: currentUser.role || "",
        department: currentUser.department || "",
        designation: currentUser.designation || currentUser.role || "",
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate phone if provided
      if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
        throw new Error(t("settings.pleaseEnterValidPhoneNumber"));
      }

      const response = await api.updateUser(currentUser.id, formData);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(t("settings.profileUpdatedSuccessfully"));
      if (refreshUser) await refreshUser();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || t("settings.failedToUpdateProfile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profileInformation")}</CardTitle>
          <CardDescription>{t("settings.viewAndManagePersonalDetails")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Header Section with Avatar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {currentUser?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{displayData.name}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="capitalize">
                  {displayData.role.replace("_", " ")}
                </Badge>
                {displayData.department && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {displayData.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Official Info - Read Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {t("settings.emailAddress")}
              </Label>
              <Input value={displayData.email} disabled className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {t("settings.designation")}
              </Label>
              <Input
                value={displayData.designation}
                disabled
                className="bg-background/50 capitalize"
              />
            </div>
          </div>

          {/* Editable Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("settings.phoneNumber")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-9"
                  placeholder={t("settings.phonePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("settings.address")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="pl-9"
                  placeholder={t("settings.addressPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">{t("settings.dateOfBirth")}</Label>
              <div className="flex gap-4">
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                {age !== null && (
                  <div className="flex items-center justify-center bg-muted px-4 rounded-md border min-w-[100px]">
                    <span className="text-sm font-medium">
                      {age} {t("settings.yearsOld")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t("settings.gender")}</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("settings.male")}</SelectItem>
                  <SelectItem value="female">{t("settings.female")}</SelectItem>
                  <SelectItem value="other">{t("settings.other")}</SelectItem>
                  <SelectItem value="prefer_not_to_say">{t("settings.preferNotToSay")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blood_group">{t("settings.bloodGroup")}</Label>
              <Select
                value={formData.blood_group}
                onValueChange={(value) => handleSelectChange("blood_group", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectBloodGroup")} />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">{t("settings.bio")}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder={t("settings.tellUsAboutYourself")}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergency_contact">{t("settings.emergencyContact")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="emergency_contact"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  className="pl-9"
                  placeholder={t("settings.nameAndPhoneNumber")}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t("settings.saving") : t("settings.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
