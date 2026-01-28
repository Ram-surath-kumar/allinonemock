import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckSquare, Plus, Edit2, Trash2, Calendar, User, Search, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { api } from "@/services/api";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  assigned_to: z.string().min(1, "Please select an assignee"),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["pending", "completed"]).default("pending"),
});

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_by: string;
  assigned_by_name?: string;
  due_date: string;
  status: "pending" | "completed";
  created_at?: string;
}

interface TaskUser {
  id: string;
  name: string;
  email: string;
}

export function Tasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"assigned_to_me" | "assigned_by_me">("assigned_to_me");
  const [userOpen, setUserOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assigned_to: "",
      due_date: "",
      status: "pending",
    },
  });

  useEffect(() => {
    loadUsers();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ status: "active" });
      if (response.data) {
        setUsers((response.data as TaskUser[]).filter((u: TaskUser) => u.id !== currentUser?.id));
      }
    } catch (error) {
      console.error("Error loading users", error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (viewMode === "assigned_to_me") {
        params.assigned_to = currentUser?.id || "";
      } else {
        params.assigned_by = currentUser?.id || "";
      }

      const response = await api.getTasks(params);
      if (response.error) throw new Error(response.error);
      const sorted = (response.data || []).sort(
        (a: Task, b: Task) => new Date(b.created_at || b.due_date).getTime() - new Date(a.created_at || a.due_date).getTime()
      );
      setTasks(sorted);
    } catch (error) {
      console.error("Error loading tasks", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTask(null);
    form.reset({
      title: "",
      description: "",
      assigned_to: "",
      due_date: "",
      status: "pending",
    });
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      status: (task.status || "pending") as "pending" | "completed",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      const response = await api.deleteTask(taskToDelete);
      if (response.error) throw new Error(response.error);
      toast.success("Task deleted successfully");
      loadTasks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const response = await api.updateTask(task.id, { status: newStatus });
      if (response.error) throw new Error(response.error);
      toast.success(`Task marked as ${newStatus}`);
      loadTasks();
    } catch (_error) {
      toast.error("Failed to update task status");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
        status: values.status,
        created_at: editingTask?.created_at || new Date().toISOString(),
      };

      if (editingTask) {
        const response = await api.updateTask(editingTask.id, finalValues);
        if (response.error) throw new Error(response.error);
        toast.success("Task updated successfully");
      } else {
        const response = await api.createTask(finalValues);
        if (response.error) throw new Error(response.error);
        toast.success("Task created successfully");
      }

      form.reset();
      setDialogOpen(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_by_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getAssigneeName = (task: Task) => {
    if (viewMode === "assigned_to_me") {
      return task.assigned_by_name || "Unknown";
    }
    return task.assigned_to_name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track tasks for your organization</p>
        </div>
        {/* @ts-expect-error - Button accepts children */}
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* View Mode Toggle */}
      {/* @ts-expect-error - Card accepts children */}
      <Card>
        {/* @ts-expect-error - CardContent accepts children */}
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {/* @ts-expect-error - Button accepts children */}
              <Button
                variant={viewMode === "assigned_to_me" ? "default" : "outline"}
                onClick={() => setViewMode("assigned_to_me")}
              >
                My Tasks
              </Button>
              {/* @ts-expect-error - Button accepts children */}
              <Button
                variant={viewMode === "assigned_by_me" ? "default" : "outline"}
                onClick={() => setViewMode("assigned_by_me")}
              >
                Tasks Given
              </Button>
            </div>
            <div className="flex gap-4 flex-1 max-w-md ml-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                {/* @ts-expect-error - SelectTrigger accepts children */}
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                {/* @ts-expect-error - SelectContent accepts children */}
                <SelectContent>
                  {/* @ts-expect-error - SelectItem accepts children */}
                  <SelectItem value="all">All Status</SelectItem>
                  {/* @ts-expect-error - SelectItem accepts children */}
                  <SelectItem value="pending">Pending</SelectItem>
                  {/* @ts-expect-error - SelectItem accepts children */}
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* @ts-expect-error - Card accepts children */
        <Card>
          {/* @ts-expect-error - CardContent accepts children */}
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            /* @ts-expect-error - Card accepts children */
            <Card
              key={task.id}
              className={cn(
                "hover:shadow-lg transition-shadow",
                task.status === "completed" && "opacity-75"
              )}
            >
              {/* @ts-expect-error - CardHeader accepts children */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* @ts-expect-error - CardTitle accepts children */}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      {/* @ts-expect-error - Badge accepts children */}
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    {/* @ts-expect-error - CardDescription accepts children */}
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <User className="h-4 w-4" />
                      <span>
                        {viewMode === "assigned_to_me" ? "From: " : "To: "}
                        {getAssigneeName(task)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {/* @ts-expect-error - Button accepts children */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(task)}
                      title={task.status === "completed" ? "Mark as pending" : "Mark as completed"}
                    >
                      <CheckSquare className={cn(
                        "h-4 w-4",
                        task.status === "completed" && "text-green-600"
                      )} />
                    </Button>
                    {/* @ts-expect-error - Button accepts children */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {/* @ts-expect-error - Button accepts children */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {/* @ts-expect-error - CardContent accepts children */}
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {format(new Date(task.due_date), "MMM dd, yyyy")}</span>
                </div>
                {task.created_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Created: {format(new Date(task.created_at), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {/* @ts-ignore - Dialog accepts children */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* @ts-expect-error - DialogContent accepts children */}
        <DialogContent className="max-w-2xl">
          {/* @ts-expect-error - DialogHeader accepts children */}
          <DialogHeader>
            {/* @ts-expect-error - DialogTitle accepts children */}
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            {/* @ts-expect-error - DialogDescription accepts children */}
            <DialogDescription>
              {editingTask ? "Update task details" : "Create a new task and assign it to a team member"}
            </DialogDescription>
          </DialogHeader>
          {/* @ts-ignore - Form accepts children */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Task Title *</FormLabel>
                    {/* @ts-expect-error - FormControl accepts children */}
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
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-ignore - FormLabel accepts children */}
                    <FormLabel>Assign To *</FormLabel>
                    {/* @ts-ignore - Popover accepts children */}
                    <Popover open={userOpen} onOpenChange={setUserOpen}>
                      {/* @ts-ignore - PopoverTrigger accepts children */}
                      <PopoverTrigger asChild>
                        {/* @ts-expect-error - FormControl accepts children */}
                        <FormControl>
                          {/* @ts-expect-error - Button accepts children */}
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
                      {/* @ts-expect-error - PopoverContent accepts children */}
                      <PopoverContent className="w-full p-0">
                        {/* @ts-expect-error - Command accepts children */}
                        <Command>
                          {/* @ts-expect-error - CommandInput accepts placeholder prop */}
                          <CommandInput placeholder="Search users..." />
                          {/* @ts-expect-error - CommandList accepts children */}
                          <CommandList>
                            {/* @ts-expect-error - CommandEmpty accepts children */}
                            <CommandEmpty>No users found.</CommandEmpty>
                            {/* @ts-expect-error - CommandGroup accepts children */}
                            <CommandGroup>
                              {users.map((user) => (
                                /* @ts-expect-error - CommandItem accepts children */
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
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Due Date *</FormLabel>
                    {/* @ts-expect-error - FormControl accepts children */}
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingTask && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    /* @ts-expect-error - FormItem accepts children */
                    <FormItem>
                      {/* @ts-expect-error - FormLabel accepts children */}
                      <FormLabel>Status</FormLabel>
                      
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        {/* @ts-expect-error - FormControl accepts children */}
                        <FormControl>
                          {/* @ts-expect-error - SelectTrigger accepts children */}
                          <SelectTrigger>
                            
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        {/* @ts-expect-error - SelectContent accepts children */}
                        <SelectContent>
                          {/* @ts-expect-error - SelectItem accepts children */}
                          <SelectItem value="pending">Pending</SelectItem>
                          {/* @ts-expect-error - SelectItem accepts children */}
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Description</FormLabel>
                    {/* @ts-expect-error - FormControl accepts children */}
                    <FormControl>
                      <Textarea placeholder="Task description..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="">
                {/* @ts-expect-error - Button accepts children */}
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                {/* @ts-expect-error - Button accepts children */}
                <Button type="submit">{editingTask ? "Update Task" : "Create Task"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {/* @ts-expect-error - AlertDialogContent accepts children */}
        <AlertDialogContent className="">
          {/* @ts-expect-error - AlertDialogHeader accepts children */}
          <AlertDialogHeader>
            {/* @ts-expect-error - AlertDialogTitle accepts children */}
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            {/* @ts-expect-error - AlertDialogDescription accepts children */}
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* @ts-expect-error - AlertDialogFooter accepts children */}
          <AlertDialogFooter>
            {/* @ts-expect-error - AlertDialogCancel accepts children */}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* @ts-expect-error - AlertDialogAction accepts children */}
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
