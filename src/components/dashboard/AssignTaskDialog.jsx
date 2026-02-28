import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Check, ChevronsUpDown, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  assigned_to: z.string().min(1, "Please select an assignee"),
  due_date: z.string().min(1, "Due date is required"),
});

export function AssignTaskDialog({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userOpen, setUserOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assigned_to: "",
      due_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadUsers();
      loadTasks();
      form.reset({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
      });
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ status: "active" });
      if (response.data) {
        setUsers(response.data.filter((u) => u.id !== currentUser?.id));
      }
    } catch (error) {
      console.error("Error loading users", error);
      toast.error("Failed to load users");
    }
  };

  const loadTasks = async () => {
    try {
      const response = await api.getTasks({ assigned_by: currentUser?.id });
      if (response.data) {
        const sorted = (response.data || []).sort(
          (a, b) => new Date(b.created_at || b.due_date).getTime() - new Date(a.created_at || a.due_date).getTime()
        );
        setTasks(sorted);
      }
    } catch (error) {
      console.error("Error loading tasks", error);
    }
  };

  const onSubmit = async (values) => {
    try {
      const assignedUser = users.find((u) => u.id === values.assigned_to);
      if (!assignedUser) {
        toast.error("Please select a valid user");
        return;
      }

      const finalValues = {
        title: values.title,
        description: values.description,
        assigned_to: values.assigned_to,
        assigned_to_name: assignedUser.name,
        assigned_by: currentUser?.id || "",
        assigned_by_name: currentUser?.name || "",
        due_date: values.due_date,
        status: "pending",
      };

      const response = await api.createTask(finalValues);
      if (response.error) throw new Error(response.error);

      toast.success("Task assigned successfully");
      form.reset();
      loadTasks();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to assign task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Complete project documentation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To *</FormLabel>
                      <Popover open={userOpen} onOpenChange={setUserOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find((u) => u.id === field.value)?.name || "Select user"
                                : "Select user"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandList>
                              <CommandEmpty>No users found.</CommandEmpty>
                              <CommandGroup>
                                {users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                      form.setValue("assigned_to", user.id);
                                      setUserOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {user.name} ({user.email})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Task description..." {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Assign Task</Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Right Column: Assigned Tasks List */}
          <div className="border-l pl-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Recent Tasks</h3>
            </div>
            <ScrollArea className="h-[500px] w-full pr-4">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks assigned yet.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {task.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
                      </div>
                      {task.assigned_to_name && (
                        <p className="text-xs text-muted-foreground">
                          To: {task.assigned_to_name}
                        </p>
                      )}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
