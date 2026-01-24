import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  type: z.enum(["info", "success", "warning", "error"]),
  recipientType: z.enum(["all", "role", "specific"]),
  role: z.string().optional(),
  userIds: z.array(z.string()).optional(),
});

export function SendNoticeDialog({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      recipientType: "all",
      role: "",
      userIds: [],
    },
    mode: "onChange",
  });

  const watchedRecipientType = form.watch("recipientType");
  const watchedUserIds = form.watch("userIds") || [];

  useEffect(() => {
    if (open) {
      loadUsers();
      form.reset();
    }
  }, [open, form]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedUsers = data.map((row) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role,
          permissions: row.permissions || [],
          department: row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status,
          avatar: row.avatar,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (userId) => {
    const currentIds = watchedUserIds;
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    form.setValue("userIds", newIds);
  };

  const filteredUsers = users.filter((user) => {
    if (watchedRecipientType === "role" && form.watch("role")) {
      return user.role === form.watch("role");
    }
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const onSubmit = async (values) => {
    try {
      let targetUserIds = [];

      if (values.recipientType === "all") {
        // Get all active users
        targetUserIds = users.map((u) => u.id);
      } else if (values.recipientType === "role" && values.role) {
        // Get users with specific role
        targetUserIds = users.filter((u) => u.role === values.role).map((u) => u.id);
      } else if (values.recipientType === "specific" && values.userIds) {
        // Get selected users
        targetUserIds = values.userIds;
      }

      if (targetUserIds.length === 0) {
        toast.error("Please select at least one recipient");
        return;
      }

      // Create notifications for all target users
      const notifications = targetUserIds.map((userId) => ({
        user_id: userId,
        title: values.title,
        message: values.message,
        type: values.type,
        read: false,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) throw error;

      // Trigger refresh event for all users who received the notice
      window.dispatchEvent(new CustomEvent("notification-sent"));

      toast.success(`Notice sent to ${targetUserIds.length} user(s) successfully`);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending notice:", error);
      toast.error(error.message || "Failed to send notice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Send Notice</DialogTitle>
          <DialogDescription>
            Send a notice to selected users. They will see it when they open the app.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter notice title"
                      {...field}
                      className={
                        form.formState.errors.title
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter notice message"
                      rows={4}
                      {...field}
                      className={
                        form.formState.errors.message
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notice type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="role">By Role</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedRecipientType === "role" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="vice_head">Vice Head</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedRecipientType === "specific" && (
              <FormField
                control={form.control}
                name="userIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Users *</FormLabel>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <ScrollArea className="h-64 rounded-lg border border-border p-3">
                        {loadingUsers ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Loading users...
                          </p>
                        ) : filteredUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No users found
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {filteredUsers.map((user) => (
                              <div key={user.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={field.value?.includes(user.id) || false}
                                  onCheckedChange={() => toggleUser(user.id)}
                                />
                                <Label
                                  htmlFor={`user-${user.id}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/10 text-xs font-medium text-primary">
                                      {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                    <div>
                                      <p className="text-sm">{user.name}</p>
                                      <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      <FormDescription>
                        {watchedUserIds.length > 0 && `${watchedUserIds.length} user(s) selected`}
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit">Send Notice</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
