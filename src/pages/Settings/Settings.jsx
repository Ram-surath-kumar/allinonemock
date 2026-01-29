import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, LANGUAGE_NAMES, LANGUAGE_NAMES_EN, SUPPORTED_LOCALES_LIST } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import {
  Bell,
  Lock,
  Shield,
  Settings as SettingsIcon,
  Users,
  User,
  Moon,
  Sun,
  Monitor,
  Globe,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { ProfileSettings } from "./ProfileSettings";
import { TeamSettings } from "./TeamSettings";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Prepare language data for Fuse.js
  const languageData = useMemo(() => {
    return SUPPORTED_LOCALES_LIST.map((loc) => ({
      code: loc,
      nativeName: LANGUAGE_NAMES[loc] || loc,
      englishName: LANGUAGE_NAMES_EN[loc] || loc,
      searchText: `${LANGUAGE_NAMES[loc]} ${LANGUAGE_NAMES_EN[loc]}`.toLowerCase(),
    }));
  }, []);

  // Initialize Fuse.js with optimized settings
  const fuse = useMemo(() => {
    return new Fuse(languageData, {
      keys: ["nativeName", "englishName", "code"],
      threshold: 0.3, // Lower = more strict, Higher = more fuzzy (0.0 to 1.0)
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
      findAllMatches: true,
    });
  }, [languageData]);

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) {
      return languageData;
    }
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse, languageData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.general")}</CardTitle>
        <CardDescription>{t("settings.customizeLookAndFeel")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t("settings.theme")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.selectPreferredTheme")}</p>
          </div>
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={theme === "light" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme("light")}
              className="w-8 h-8 p-0"
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="w-8 h-8 p-0"
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === "system" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme("system")}
              className="w-8 h-8 p-0"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label>{t("settings.displayLanguage")}</Label>
            </div>
            <p className="text-sm text-muted-foreground">{t("settings.languageDescription")}</p>
          </div>
          <Popover
            open={languageOpen}
            onOpenChange={(open) => {
              setLanguageOpen(open);
              if (!open) {
                setSearchQuery("");
                setSelectedIndex(-1);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={languageOpen}
                className="w-[320px] justify-between h-auto py-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{LANGUAGE_NAMES[locale] || locale}</span>
                  <span className="text-muted-foreground text-sm shrink-0">
                    ({LANGUAGE_NAMES_EN[locale] || locale})
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <div className="border-b">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder={t("settings.selectLanguage") + "..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedIndex((prev) =>
                          prev < filteredLanguages.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                      } else if (
                        e.key === "Enter" &&
                        selectedIndex >= 0 &&
                        filteredLanguages[selectedIndex]
                      ) {
                        e.preventDefault();
                        setLocale(filteredLanguages[selectedIndex].code);
                        setLanguageOpen(false);
                        setSearchQuery("");
                        setSelectedIndex(-1);
                      } else if (e.key === "Escape") {
                        setLanguageOpen(false);
                        setSearchQuery("");
                        setSelectedIndex(-1);
                      }
                    }}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 bg-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {t("common.noResults") || "No language found."}
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredLanguages.map((lang, index) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setLocale(lang.code);
                          setLanguageOpen(false);
                          setSearchQuery("");
                          setSelectedIndex(-1);
                        }}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          "transition-colors",
                          locale === lang.code && "bg-accent/50",
                          selectedIndex === index && "bg-accent"
                        )}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium text-sm leading-tight">
                            {lang.nativeName}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {lang.englishName}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 ml-2",
                            locale === lang.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationSettings = () => {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications")}</CardTitle>
        <CardDescription>
          {t("settings.manageNotificationPreferences") || "Manage your notification preferences"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label>{t("settings.emailNotifications") || "Email Notifications"}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.receiveEmailsAboutUpdates") ||
                  "Receive emails about important updates"}
              </p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
};

const SecuritySettings = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordsDoNotMatch") || "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("settings.passwordMinLength") || "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(t("settings.passwordUpdatedSuccessfully") || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(
        error.message || t("settings.failedToUpdatePassword") || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.security")}</CardTitle>
        <CardDescription>
          {t("settings.managePasswordSecurity") || "Manage your password and account security"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {t("settings.currentPasswordOptional") ||
                "Current Password (optional for logged in users)"}
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("settings.enterCurrentPassword") || "Enter current password"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.newPassword") || "New Password"}</Label>
            <Input
              id="new-password"
              type="password"
              required
              validations={{
                required: t("settings.passwordRequired") || "Password is required",
                minLength: {
                  value: 6,
                  message:
                    t("settings.passwordMinLengthMessage") ||
                    "Password must have at least 6 characters",
                },
              }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("settings.enterNewPassword") || "Enter new password"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t("settings.confirmNewPassword") || "Confirm New Password"}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("settings.confirmNewPasswordPlaceholder") || "Confirm new password"}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading
              ? t("settings.updating") || "Updating..."
              : t("settings.updatePassword") || "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SystemSettings = ({ currentUser }) => {
  const [orgName, setOrgName] = useState(currentUser?.organization?.org_name || "");
  const [loading, setLoading] = useState(false);

  const handleOrgUpdate = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    if (!currentUser?.organization?.id) {
      toast.error("Organization ID not found");
      return;
    }

    setLoading(true);
    try {
      const response = await api.updateOrganization(currentUser.organization.id, {
        org_name: orgName,
      });

      if (response.error) throw new Error(response.error);

      toast.success("Organization details updated successfully");
      // Ideally refetch user/org data here or update context
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(error.message || "Failed to update organization details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Manage organization information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization Code</Label>
            <Input
              value={currentUser?.organization?.org_code || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <Button onClick={handleOrgUpdate} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Version and maintenance details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const Settings = () => {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const isAdmin = currentUser?.role === "admin";
  const isStudent = currentUser?.role === "student";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8 animate-fade-in sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("settings.manageAccountSettings")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full flex h-auto items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground overflow-x-auto no-scrollbar scroll-smooth">
          <TabsTrigger value="profile" className="flex items-center gap-2 px-4">
            <User className="h-4 w-4" />
            {t("settings.profile")}
          </TabsTrigger>

          {/* Only non-students can see the Team tab */}
          {!isStudent && (
            <TabsTrigger value="team" className="flex items-center gap-2 px-4">
              <Users className="h-4 w-4" />
              {t("settings.team")}
            </TabsTrigger>
          )}

          <TabsTrigger value="security" className="flex items-center gap-2 px-4">
            <Lock className="h-4 w-4" />
            {t("settings.security")}
          </TabsTrigger>

          {isAdmin && (
            <TabsTrigger value="system" className="flex items-center gap-2 px-4">
              <Shield className="h-4 w-4" />
              {t("settings.system")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings currentUser={currentUser} />
          <AppearanceSettings />
          <NotificationSettings />
        </TabsContent>

        {!isStudent && (
          <TabsContent value="team">
            <TeamSettings currentUser={currentUser} />
          </TabsContent>
        )}

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="system">
            <SystemSettings currentUser={currentUser} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
