import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock, Users, DollarSign, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  type: z.enum(["invite", "information"], {
    required_error: "Event type is required",
  }),
  fee: z.number().min(0).optional().default(0),
  department_id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location is required"),
  description: z.string().optional(),
  recipient_roles: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You must select at least one recipient role.",
  }),
  facility_id: z.string().optional(),
});

const rolesList = [
  { id: "vice_head", label: "Vice Head" },
  { id: "teacher", label: "Teacher" },
  { id: "student", label: "Student" },
  { id: "housekeeping", label: "Housekeeping Staff" },
  { id: "librarian", label: "Librarian" },
  { id: "accountant", label: "Accountant" },
];

interface Event {
  id: string;
  title: string;
  type: "invite" | "information";
  fee?: number;
  department_id?: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  recipient_roles?: string[];
  facility_id?: string;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
}

export function Events() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [_facilities, setFacilities] = useState<unknown[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [roleOpen, setRoleOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "information",
      fee: 0,
      department_id: "",
      date: "",
      time: "",
      location: "",
      description: "",
      recipient_roles: [],
      facility_id: "",
    },
  });

  useEffect(() => {
    loadEvents();
    loadDepartments();
    loadFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.getEvents({ role: currentUser?.role });
      if (response.error) throw new Error(response.error);
      const sorted = (response.data || []).sort(
        (a: Event, b: Event) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
      );
      setEvents(sorted);
    } catch (error) {
      console.error("Error loading events", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.getDepartments();
      if (response.data) {
        setDepartments(response.data as Department[]);
      }
    } catch (error) {
      console.error("Error loading departments", error);
    }
  };

  const loadFacilities = async () => {
    try {
      const response = await api.getFacilities();
      if (response.data) {
        setFacilities(response.data);
      }
    } catch (error) {
      console.error("Error loading facilities", error);
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    form.reset();
    setDialogOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      title: event.title || "",
      type: event.type || "information",
      fee: event.fee || 0,
      department_id: event.department_id || "",
      date: event.date ? event.date.split("T")[0] : "",
      time: event.time || "",
      location: event.location || "",
      description: event.description || "",
      recipient_roles: event.recipient_roles || [],
      facility_id: event.facility_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const response = await api.deleteEvent(eventToDelete);
      if (response.error) throw new Error(response.error);
      toast.success("Event deleted successfully");
      loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const finalValues = {
        ...values,
        department_id: values.department_id || null,
        userId: currentUser?.id,
      };

      if (editingEvent) {
        const response = await api.updateEvent(editingEvent.id, finalValues);
        if (response.error) throw new Error(response.error);
        toast.success("Event updated successfully");
      } else {
        const response = await api.createEvent(finalValues);
        if (response.error) throw new Error(response.error);
        toast.success("Event created successfully");
      }

      form.reset();
      setDialogOpen(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const showDepartment = form.watch("recipient_roles")?.includes("student");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage and schedule events for your organization</p>
        </div>
        {/* @ts-expect-error - Button accepts children */}
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      {/* @ts-expect-error - Card accepts children */}
      <Card>
        {/* @ts-expect-error - CardContent accepts children */}
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              {/* @ts-expect-error - SelectTrigger accepts children */}
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
               
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              {/* @ts-expect-error - SelectContent accepts children */}
              <SelectContent>
                {/* @ts-expect-error - SelectItem accepts children */}
                <SelectItem value="all">All Events</SelectItem>
                {/* @ts-expect-error - SelectItem accepts children */}
                <SelectItem value="information">Information</SelectItem>
                {/* @ts-expect-error - SelectItem accepts children */}
                <SelectItem value="invite">Invite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* @ts-expect-error - Card accepts children */
        <Card>
          {/* @ts-expect-error - CardContent accepts children */}
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            /* @ts-expect-error - Card accepts children */
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              {/* @ts-expect-error - CardHeader accepts children */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* @ts-expect-error - CardTitle accepts children */}
                    <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {/* @ts-expect-error - Badge accepts children */}
                      <Badge variant={event.type === "invite" ? "default" : "secondary"}>
                        {event.type === "invite" ? "Invite" : "Information"}
                      </Badge>
                      {event.type === "invite" && event.fee && event.fee > 0 && (
                        /* @ts-expect-error - Badge accepts children */
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ₹{event.fee}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* @ts-expect-error - Button accepts children */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {/* @ts-expect-error - Button accepts children */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {/* @ts-expect-error - CardContent accepts children */}
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                {event.recipient_roles && event.recipient_roles.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {event.recipient_roles.map((r: string) => rolesList.find(role => role.id === r)?.label || r).join(", ")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* @ts-expect-error - DialogContent accepts children */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* @ts-expect-error - DialogHeader accepts children */}
          <DialogHeader>
            {/* @ts-expect-error - DialogTitle accepts children */}
            <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            {/* @ts-expect-error - DialogDescription accepts children */}
            <DialogDescription>
              {editingEvent ? "Update event details" : "Schedule a new event for your organization"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Event Title *</FormLabel>
                    {/* @ts-expect-error - FormControl accepts children */}
                    <FormControl>
                      <Input placeholder="e.g. Annual Sports Meet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Event Type *</FormLabel>
                    
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      {/* @ts-expect-error - FormControl accepts children */}
                      <FormControl>
                        {/* @ts-expect-error - SelectTrigger accepts children */}
                        <SelectTrigger>
                         
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      {/* @ts-expect-error - SelectContent accepts children */}
                      <SelectContent>
                        {/* @ts-expect-error - SelectItem accepts children */}
                        <SelectItem value="information">Information</SelectItem>
                        {/* @ts-expect-error - SelectItem accepts children */}
                        <SelectItem value="invite">Invite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("type") as "invite" | "information") === "invite" && (
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    /* @ts-expect-error - FormItem accepts children */
                    <FormItem>
                      {/* @ts-expect-error - FormLabel accepts children */}
                      <FormLabel>Fee (₹)</FormLabel>
                      {/* @ts-expect-error - FormControl accepts children */}
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                     
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    /* @ts-expect-error - FormItem accepts children */
                    <FormItem>
                      {/* @ts-expect-error - FormLabel accepts children */}
                      <FormLabel>Date *</FormLabel>
                      {/* @ts-expect-error - FormControl accepts children */}
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                     
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    /* @ts-expect-error - FormItem accepts children */
                    <FormItem>
                      {/* @ts-expect-error - FormLabel accepts children */}
                      <FormLabel>Time *</FormLabel>
                      {/* @ts-expect-error - FormControl accepts children */}
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                     
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Location *</FormLabel>
                    {/* @ts-expect-error - FormControl accepts children */}
                    <FormControl>
                      <Input placeholder="e.g. Main Auditorium" {...field} />
                    </FormControl>
                   
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipient_roles"
                render={() => (
                  /* @ts-expect-error - FormItem accepts children */
                  <FormItem>
                    {/* @ts-expect-error - FormLabel accepts children */}
                    <FormLabel>Recipient Roles *</FormLabel>
                    
                    <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                      
                      <PopoverTrigger asChild>
                        {/* @ts-expect-error - FormControl accepts children */}
                        <FormControl>
                          {/* @ts-expect-error - Button accepts children */}
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !form.watch("recipient_roles")?.length && "text-muted-foreground"
                            )}
                          >
                            {form.watch("recipient_roles")?.length
                              ? `${form.watch("recipient_roles").length} role(s) selected`
                              : "Select roles"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {/* @ts-expect-error - PopoverContent accepts children */}
                      <PopoverContent className="w-full p-0">
                        {/* @ts-expect-error - Command accepts children */}
                        <Command>
                          {/* @ts-expect-error - CommandInput accepts placeholder prop */}
                          <CommandInput placeholder="Search roles..." />
                          {/* @ts-expect-error - CommandList accepts children */}
                          <CommandList>
                            {/* @ts-expect-error - CommandEmpty accepts children */}
                            <CommandEmpty>No roles found.</CommandEmpty>
                            {/* @ts-expect-error - CommandGroup accepts children */}
                            <CommandGroup>
                              {rolesList.map((role) => (
                                /* @ts-expect-error - CommandItem accepts children */
                                <CommandItem
                                  key={role.id}
                                  value={role.id}
                                  onSelect={() => {
                                    const current = form.getValues("recipient_roles") || [];
                                    const updated = current.includes(role.id)
                                      ? current.filter((r) => r !== role.id)
                                      : [...current, role.id];
                                    form.setValue("recipient_roles", updated);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.watch("recipient_roles")?.includes(role.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {role.label}
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

              {showDepartment && (
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    /* @ts-expect-error - FormItem accepts children */
                    <FormItem>
                      {/* @ts-expect-error - FormLabel accepts children */}
                      <FormLabel>Department</FormLabel>
                    
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        {/* @ts-expect-error - FormControl accepts children */}
                        <FormControl>
                          {/* @ts-expect-error - SelectTrigger accepts children */}
                          <SelectTrigger>
                           
                            <SelectValue placeholder="Select department (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        {/* @ts-expect-error - SelectContent accepts children */}
                        <SelectContent>
                          {/* @ts-expect-error - SelectItem accepts children */}
                          <SelectItem value="">All Departments</SelectItem>
                          {departments.map((dept: Department) => (
                            /* @ts-expect-error - SelectItem accepts children */
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
                      <Textarea placeholder="Event description..." {...field} rows={3} />
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
                <Button type="submit">{editingEvent ? "Update Event" : "Create Event"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {/* @ts-expect-error - AlertDialogContent accepts children */}
        <AlertDialogContent>
          {/* @ts-expect-error - AlertDialogHeader accepts children */}
          <AlertDialogHeader>
            {/* @ts-expect-error - AlertDialogTitle accepts children */}
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            {/* @ts-expect-error - AlertDialogDescription accepts children */}
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
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
