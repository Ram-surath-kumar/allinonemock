import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ROLE_LABELS,
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_ALLOWED_PERMISSIONS,
} from "@/types/erp";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { fetchDepartments } from "@/services/departments";
import { api } from "@/services/api";
import { extractStudentDataFromFile } from "@/services/gemini";
import { Sparkles, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().optional(), // Email is optional for all roles - will be auto-generated
    college_email: z
      .string()
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal("")),
    role: z.string().min(1, "Please select a role"), // Accept any string to support custom roles
    department_id: z.string().optional(),
    department_ids: z.array(z.string()).optional(),
    permissions: z.array(z.string()),
    loopid: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "student") {
        return !!data.department_id && data.department_id.length > 0;
      }
      return true;
    },
    {
      message: "Please select a department for the student",
      path: ["department_id"],
    }
  )
  .refine(
    (data) => {
      if (data.role === "teacher") {
        return data.department_ids && data.department_ids.length > 0;
      }
      return true;
    },
    {
      message: "Please select at least one department for the teacher",
      path: ["department_ids"],
    }
  );

export function AddUserDialog({ open, onOpenChange, onAdd, onAddMultiple }) {
  const { currentUser, canManageRole } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);
  const [loadingCustomRoles, setLoadingCustomRoles] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedFile, setSelectedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  const availableRoles = Object.keys(ROLE_LABELS).filter((r) => canManageRole(r));

  // Combine default roles with custom roles
  const allAvailableRoles = [
    ...availableRoles.map((r) => ({ id: r, name: ROLE_LABELS[r], isCustom: false })),
    ...customRoles.map((r) => ({
      id: r.id,
      name: r.name,
      isCustom: true,
      permissions: r.permissions,
    })),
  ];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      college_email: "",
      role: undefined,
      department_id: "",
      department_ids: [],
      permissions: [],
      loopid: "",
    },
    mode: "onChange",
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadCustomRoles();
      form.reset();
      setSelectedFile(null);
      setExtractedStudents([]);
      setUserPrompt("");
      setActiveTab("manual");
    }
  }, [open]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadCustomRoles = async () => {
    try {
      setLoadingCustomRoles(true);
      const response = await api.getCustomRoles();
      if (response.error) throw new Error(response.error);

      if (response.data && Array.isArray(response.data)) {
        setCustomRoles(response.data);
      }
    } catch (error) {
      console.error("Error loading custom roles:", error);
      // Don't show error toast - custom roles are optional
    } finally {
      setLoadingCustomRoles(false);
    }
  };

  useEffect(() => {
    if (watchedRole) {
      // Check if it's a custom role
      const customRole = customRoles.find((r) => r.id === watchedRole);
      if (customRole) {
        // Use custom role permissions
        form.setValue("permissions", customRole.permissions);
      } else {
        // Use default role permissions
        const defaultPermissions = ROLE_DEFAULT_PERMISSIONS[watchedRole] || [];
        form.setValue("permissions", defaultPermissions);
      }
      form.setValue("department_id", "");
      form.setValue("department_ids", []);
    }
  }, [watchedRole, form, customRoles]);

  const togglePermission = (permissionId, currentPermissions) => {
    // Check if it's a custom role
    const customRole = customRoles.find((r) => r.id === watchedRole);
    if (customRole) {
      // For custom roles, allow all permissions
      const newPermissions = currentPermissions.includes(permissionId)
        ? currentPermissions.filter((p) => p !== permissionId)
        : [...currentPermissions, permissionId];
      form.setValue("permissions", newPermissions);
    } else {
      // For default roles, only allow toggling permissions that are allowed for the role
      const allowedPerms = ROLE_ALLOWED_PERMISSIONS[watchedRole] || [];
      if (!allowedPerms.includes(permissionId)) {
        return; // Don't allow toggling disallowed permissions
      }

      const filtered = currentPermissions.filter((p) => allowedPerms.includes(p)); // Remove any disallowed permissions
      const newPermissions = filtered.includes(permissionId)
        ? filtered.filter((p) => p !== permissionId)
        : [...filtered, permissionId];
      form.setValue("permissions", newPermissions);
    }
  };

  const toggleDepartment = (deptId, currentDeptIds) => {
    const newDeptIds = currentDeptIds.includes(deptId)
      ? currentDeptIds.filter((id) => id !== deptId)
      : [...currentDeptIds, deptId];
    form.setValue("department_ids", newDeptIds);
  };

  const onSubmit = (values) => {
    // Email is optional - will be auto-generated+ user_id @loopverse.in
    onAdd({
      name: values.name,
      email: values.email || undefined,
      college_email: values.college_email || undefined,
      role: values.role,
      permissions: values.permissions,
      loopid: values.loopid,
      ...(values.role === "student" ? { department_id: values.department_id } : {}),
      ...(values.role === "teacher" ? { department_ids: values.department_ids || [] } : {}),
    });

    form.reset();
    onOpenChange(false);
    toast.success("User added successfully");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedStudents([]);
    }
  };

  const handleExtractData = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setExtracting(true);
      const extracted = await extractStudentDataFromFile(selectedFile, userPrompt);

      // Parse user prompt to extract department name if mentioned
      let promptDepartment = null;
      if (userPrompt) {
        // Look for patterns like "to CPEI department", "to CPEI", "CPEI department", etc.
        const deptMatch = userPrompt.match(
          /(?:to|in|department|dept)[\s:]*([A-Za-z0-9\s]+?)(?:\s+department|\s+dept|$|,|\.)/i
        );
        if (deptMatch) {
          promptDepartment = deptMatch[1].trim();
        } else {
          // Try to find department name directly (e.g., "CPEI", "Computer Science")
          const words = userPrompt.split(/\s+/);
          for (const word of words) {
            const dept = departments.find(
              (d) =>
                d.name.toLowerCase().includes(word.toLowerCase()) ||
                word.toLowerCase().includes(d.name.toLowerCase())
            );
            if (dept) {
              promptDepartment = dept.name;
              break;
            }
          }
        }
      }

      // Map department names to department IDs
      const studentsWithDeptIds = await Promise.all(
        extracted.map(async (student) => {
          let department_id = student.department_id;
          let department_name = student.department;

          // If user prompt specifies a department, use that
          if (promptDepartment) {
            const dept = departments.find(
              (d) =>
                d.name.toLowerCase() === promptDepartment.toLowerCase() ||
                d.name.toLowerCase().includes(promptDepartment.toLowerCase()) ||
                promptDepartment.toLowerCase().includes(d.name.toLowerCase())
            );
            if (dept) {
              department_id = dept.id;
              department_name = dept.name;
            } else {
              // If department not found, use the prompt text as department name
              department_name = promptDepartment;
            }
          }

          // If department name is provided but not department_id, try to find it
          if (department_name && !department_id) {
            const dept = departments.find(
              (d) =>
                d.name.toLowerCase().includes(department_name.toLowerCase()) ||
                department_name.toLowerCase().includes(d.name.toLowerCase())
            );
            department_id = dept?.id;
          }

          return {
            ...student,
            department: department_name || student.department,
            department_id,
            selected: true, // All selected by default
          };
        })
      );

      setExtractedStudents(studentsWithDeptIds);
      toast.success(`Extracted ${studentsWithDeptIds.length} student(s) from file`);
    } catch (error) {
      console.error("Error extracting data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to extract student data from file";

      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage;
      if (
        errorMessage.includes("No students found") ||
        errorMessage.includes("No valid student data")
      ) {
        userFriendlyMessage =
          "No student data found in the file. Please ensure the file contains student names and IDs. Try a different file or check the file format.";
      } else if (errorMessage.includes("parse") || errorMessage.includes("JSON")) {
        userFriendlyMessage =
          "AI returned data in unexpected format. Please try again or use a different file.";
      } else if (errorMessage.includes("No response")) {
        userFriendlyMessage = "AI service is not responding. Please try again in a moment.";
      }

      toast.error(userFriendlyMessage, { duration: 5000 });
    } finally {
      setExtracting(false);
    }
  };

  const handleAddExtractedStudents = async () => {
    const selected = extractedStudents.filter((s) => s.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one student to add");
      return;
    }

    try {
      setAddingStudents(true);

      if (onAddMultiple) {
        // Add all students at once using bulk insert
        // Note: loopid will be auto-generated+ user_id when user is created
        const usersToAdd = selected.map((student) => ({
          name: student.name,
          role: "student",
          permissions: [],
          department_id: student.department_id,
        }));

        await onAddMultiple(usersToAdd);
        // Clear extracted students after successful add
        setExtractedStudents([]);
        setSelectedFile(null);
        setUserPrompt("");
      } else {
        // Add one by one
        // Note: loopid will be auto-generated+ user_id when user is created
        for (const student of selected) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between adds
          onAdd({
            name: student.name,
            role: "student",
            permissions: [],
            department_id: student.department_id,
          });
        }
        toast.success(`Added ${selected.length} student(s) successfully`);
      }

      // Reset
      setSelectedFile(null);
      setExtractedStudents([]);
      setActiveTab("manual");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding students:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add students";
      toast.error(errorMessage);
    } finally {
      setAddingStudents(false);
    }
  };

  const toggleStudentSelection = (index) => {
    setExtractedStudents((prev) =>
      prev.map((student, i) =>
        i === index ? { ...student, selected: !student.selected } : student
      )
    );
  };

  // Get allowed permissions for the selected role
  const getAllowedPermissions = (role) => {
    if (!role) return [];
    const allowedPermissionIds = ROLE_ALLOWED_PERMISSIONS[role] || [];
    return PERMISSIONS.filter((p) => allowedPermissionIds.includes(p.id));
  };

  const groupedPermissions = (() => {
    const allowedPerms = getAllowedPermissions(watchedRole);
    return allowedPerms.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});
  })();

  const categoryLabels = {
    student: "Student Data",
    staff: "Staff Management",
    finance: "Finance",
    academic: "Academics",
    facility: "Facilities",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-full p-3 sm:p-6 rounded-2xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account manually or use AI to extract data from files/images.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Add with AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter full name"
                            {...field}
                            className={
                              form.formState.errors.name
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Email will be auto-generated as {`{org_id}{user_id}@loopverse.in`} for all
                          users
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="college_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="user@college.edu"
                            {...field}
                            className={
                              form.formState.errors.college_email
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          A welcome email with login credentials will be sent to this email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("department_id", "");
                            form.setValue("department_ids", []);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={form.formState.errors.role ? "border-destructive" : ""}
                            >
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allAvailableRoles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedRole === "student" && (
                    <>
                      {/* Loop ID is now auto-generated by backend, field removed */}
                      <FormField
                        control={form.control}
                        name="department_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department *</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={loadingDepartments}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={
                                    form.formState.errors.department_id ? "border-destructive" : ""
                                  }
                                >
                                  <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {watchedRole === "teacher" && (
                    <FormField
                      control={form.control}
                      name="department_ids"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departments *</FormLabel>
                          <div
                            className={`rounded-lg border p-3 min-h-[80px] max-h-[200px] overflow-y-auto ${form.formState.errors.department_ids
                              ? "border-destructive"
                              : "border-border"
                              }`}
                          >
                            {loadingDepartments ? (
                              <p className="text-sm text-muted-foreground">
                                Loading departments...
                              </p>
                            ) : departments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No departments available
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {departments.map((dept) => (
                                  <div key={dept.id} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`dept-${dept.id}`}
                                      checked={field.value?.includes(dept.id) || false}
                                      onCheckedChange={() =>
                                        toggleDepartment(dept.id, field.value || [])
                                      }
                                    />
                                    <Label
                                      htmlFor={`dept-${dept.id}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {dept.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {watchedRole &&
                  watchedRole !== "student" &&
                  (customRoles.find((r) => r.id === watchedRole) ||
                    !["student"].includes(watchedRole)) &&
                  Object.keys(groupedPermissions).length > 0 && (
                    <FormField
                      control={form.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="rounded-lg border border-border p-4 space-y-6">
                            {Object.entries(groupedPermissions).map(([category, permissions]) => (
                              <div key={category}>
                                <h4 className="text-sm font-medium text-foreground mb-3">
                                  {categoryLabels[category]}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-start gap-3">
                                      <Checkbox
                                        id={permission.id}
                                        checked={field.value?.includes(permission.id) || false}
                                        onCheckedChange={() =>
                                          togglePermission(permission.id, field.value || [])
                                        }
                                      />
                                      <div className="grid gap-0.5">
                                        <Label
                                          htmlFor={permission.id}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {permission.name}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                          {permission.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Select the permissions for this user role
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                {watchedRole === "student" && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      Students can only view their own data. No additional permissions are required.
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add User</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-4">
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setExtractedStudents([]);
                        setUserPrompt("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* User Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="user-prompt">Instructions (Optional)</Label>
                <textarea
                  id="user-prompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., Add the students present in the attachment to CPEI department"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Provide instructions for the AI. For example: "Add all students to CPEI
                  department" or "Assign students to Computer Science"
                </p>
              </div>

              {/* Extract Button */}
              {selectedFile && (
                <Button onClick={handleExtractData} disabled={extracting} className="w-full">
                  {extracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extract Student Data
                    </>
                  )}
                </Button>
              )}

              {/* Extracted Students Table */}
              {extractedStudents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      Extracted Students ({extractedStudents.filter((s) => s.selected).length}{" "}
                      selected)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExtractedStudents((prev) =>
                          prev.map((s) => ({ ...s, selected: !s.selected }))
                        );
                      }}
                    >
                      {extractedStudents.every((s) => s.selected) ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={extractedStudents.every((s) => s.selected)}
                              onCheckedChange={(checked) => {
                                setExtractedStudents((prev) =>
                                  prev.map((s) => ({ ...s, selected: !!checked }))
                                );
                              }}
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedStudents.map((student, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                checked={student.selected}
                                onCheckedChange={() => toggleStudentSelection(index)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              {student.department ||
                                (student.department_id &&
                                  departments.find((d) => d.id === student.department_id)?.name) ||
                                "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      {extractedStudents.filter((s) => s.selected).length} student(s) will be added
                    </p>
                    <Button
                      onClick={handleAddExtractedStudents}
                      disabled={
                        addingStudents || extractedStudents.filter((s) => s.selected).length === 0
                      }
                    >
                      {addingStudents ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Students...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Add Selected Students
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
