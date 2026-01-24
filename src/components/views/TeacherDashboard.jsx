import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ListFilter,
  CheckCircle,
  Circle,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskViewMode, setTaskViewMode] = useState("to_me"); // 'to_me' or 'by_me'

  // Schedule state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    class_name: "",
    time: "",
    room: "",
  });

  // Task state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assigned_to: "", // In real app, create select for students
    assigned_to_name: "",
    due_date: "",
    status: "pending",
  });
  const [users, setUsers] = useState([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadSchedules();
      loadUsers();
      loadEvents();
      loadTasks();
    }
  }, [currentUser]);

  const loadSchedules = async () => {
    try {
      if (!currentUser?.id) return;
      const response = await api.getSchedules({ teacher_id: currentUser.id });
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      console.error("Failed to load schedules", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ role: "student" });
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load students", error);
    }
  };

  const loadTasks = async () => {
    try {
      if (!currentUser?.id) return;

      // Fetch tasks assigned BY me and TO me (if any)
      const [byMe, toMe] = await Promise.all([
        api.getTasks({ assigned_by: currentUser.id }),
        api.getTasks({ assigned_to: currentUser.id }),
      ]);

      let allTasks = [];
      if (byMe.data) allTasks = [...allTasks, ...byMe.data.map((t) => ({ ...t, type: "by_me" }))];
      if (toMe.data) allTasks = [...allTasks, ...toMe.data.map((t) => ({ ...t, type: "to_me" }))];

      // Remove duplicates if any
      const uniqueTasks = Array.from(new Map(allTasks.map((item) => [item.id, item])).values());

      setTasks(uniqueTasks);
    } catch (error) {
      console.error("Failed to load tasks", error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await api.getEvents({ role: (currentUser?.role || 'teacher').toLowerCase() });
      if (response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error("Failed to load events", error);
    }
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setFormData({
        subject: schedule.subject,
        class_name: schedule.class_name,
        time: schedule.time,
        room: schedule.room,
      });
      setCurrentSchedule(schedule);
    } else {
      setFormData({
        subject: "",
        class_name: "",
        time: "",
        room: "",
      });
      setCurrentSchedule(null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.subject || !formData.class_name || !formData.time) {
        toast.error("Please fill in required fields");
        return;
      }

      const scheduleData = {
        ...formData,
        teacher_id: currentUser.id,
        teacher_name: currentUser.name,
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }), // Simple default
      };

      let response;
      if (currentSchedule) {
        response = await api.updateSchedule(currentSchedule.id, scheduleData);
      } else {
        response = await api.createSchedule(scheduleData);
      }

      if (response.error) throw new Error(response.error);

      toast.success(currentSchedule ? "Class updated" : "Class added");
      setIsDialogOpen(false);
      loadSchedules();
    } catch (error) {
      toast.error(error.message || "Failed to save class");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      const response = await api.deleteSchedule(id);
      if (response.error) throw new Error(response.error);
      toast.success("Class deleted");
      loadSchedules();
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  const handleOpenTaskDialog = () => {
    setTaskFormData({
      title: "",
      description: "",
      assigned_to: "",
      assigned_to_name: "",
      due_date: "",
      status: "pending",
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      if (!taskFormData.title || !taskFormData.assigned_to || !taskFormData.due_date) {
        toast.error("Please fill in required fields");
        return;
      }

      const newTask = {
        ...taskFormData,
        assigned_by: currentUser.id,
        assigned_by_name: currentUser.name,
        created_at: new Date().toISOString(),
      };

      const response = await api.createTask(newTask);
      if (response.error) throw new Error(response.error);

      toast.success("Task assigned successfully");
      setIsTaskDialogOpen(false);
      loadTasks();
    } catch (error) {
      toast.error(error.message || "Failed to assign task");
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const response = await api.updateTask(task.id, { status: newStatus });
      if (response.error) throw new Error(response.error);

      toast.success(`Task marked as ${newStatus}`);
      loadTasks();
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* ... existing stats ... */}
        <StatsCard title="My Students" value="127" change="Across 3 classes" icon={Users} />
        <StatsCard
          title="Classes Today"
          value={schedules.length.toString()}
          change="Updated just now"
          icon={BookOpen}
        />
        <StatsCard title="Assignments Due" value="5" change="2 need grading" icon={Calendar} />
        <StatsCard title="Attendance Today" value="96%" change="4 students absent" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Classes
            </CardTitle>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" /> Add Class
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No classes scheduled for today.
              </p>
            ) : (
              schedules.map((classItem, index) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 animate-slide-up hover:bg-muted/50 transition-colors group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div>
                    <p className="font-medium text-foreground">{classItem.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {classItem.class_name} • {classItem.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{classItem.time}</Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(classItem)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(classItem.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {taskViewMode === "to_me" ? "My Tasks" : "Tasks Given"}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={taskViewMode === "by_me" ? "secondary" : "ghost"}
                onClick={() => setTaskViewMode((prev) => (prev === "to_me" ? "by_me" : "to_me"))}
                title={
                  taskViewMode === "to_me"
                    ? "Show tasks assigned by me"
                    : "Show tasks assigned to me"
                }
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenTaskDialog()}>
                <Plus className="h-4 w-4 mr-1" /> Assign Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No tasks found.</p>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 animate-slide-up group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-1 flex items-start gap-3">
                    {taskViewMode === "to_me" && (
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    <div>
                      <p
                        className={`font-medium ${task.status === "completed" && taskViewMode === "to_me" ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {taskViewMode === "by_me"
                          ? `To: ${task.assigned_to_name || "Student"}`
                          : `By: ${task.assigned_by_name || "Admin"}`}{" "}
                        • Due: {task.due_date}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge only if viewing 'by_me' or if completed/pending distinction needed visually aside from toggle */}
                  {taskViewMode === "by_me" && (
                    <Badge variant={task.status === "pending" ? "secondary" : "default"}>
                      {task.status}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-border p-3 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {event.date}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.time} @ {event.location}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Assignment Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader className="px-0">
            <DialogTitle>Assign Task to Student</DialogTitle>
            <DialogDescription>Create a new task for a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="task_title">Task Title</Label>
              <Input
                id="task_title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="e.g. Complete Biology Project"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assign To</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {taskFormData.assigned_to_name
                      ? taskFormData.assigned_to_name
                      : "Select student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandList>
                      <CommandEmpty>No student found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => {
                              setTaskFormData({
                                ...taskFormData,
                                assigned_to: user.id,
                                assigned_to_name: user.name,
                              });
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                taskFormData.assigned_to === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name}{" "}
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({user.role})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Task details..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="px-0">
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentSchedule ? "Edit Class" : "Add New Class"}</DialogTitle>
            <DialogDescription>Set the details for this class period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class_name">Class / Grade</Label>
              <Input
                id="class_name"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                placeholder="e.g. Grade 10-A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g. 09:00 AM"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g. Room 101"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
