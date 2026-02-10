import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; // Assuming these exist, if not, direct list
import { toast } from "sonner";
import { api } from "@/services/api";
import { Check, ChevronsUpDown, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

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

export function ScheduleEventDialog({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const form = useForm({
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

  // Watch recipient_roles to conditionally show department selection
  const selectedRoles = form.watch("recipient_roles");
  const showDepartment =
    selectedRoles &&
    selectedRoles.length > 0 &&
    selectedRoles.every((role) => ["student", "teacher"].includes(role));

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadFacilities();
      loadEvents();
      form.reset({
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
      });
    }
  }, [open]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const { data, error } = await api.getDepartments();
      if (error) throw new Error(error);
      setDepartments(data || []);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const { data, error } = await api.getFacilities();
      if (error) throw new Error(error);
      setFacilities(data || []);
    } catch (error) {
      console.error("Error loading facilities:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await api.getEvents(); // Fetch all events
      if (error) throw new Error(error);
      // Sort by date descending
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );
      setEvents(sorted);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const onSubmit = async (values) => {
    try {
      // Check if trying to schedule in the past
      const eventDateTime = new Date(`${values.date}T${values.time}`);
      if (eventDateTime < new Date()) {
        toast.warning("Note: You are scheduling an event in the past");
      }

      const finalValues = {
        ...values,
        department_id: showDepartment ? values.department_id : null,
        userId: currentUser?.id,
        facility_id: values.facility_id,
      };

      const { error } = await api.createEvent(finalValues);

      if (error) throw new Error(error);

      toast.success("Event scheduled successfully");
      form.reset();
      loadEvents(); // Reload list
      // Don't close immediately if user wants to see it added, or maybe close.
      // onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling event:", error);
      toast.error(error.message || "Failed to schedule event");
    }
  };

  const handleDeleteEvent = async (id) => {
    // Implement delete logic if endpoint exists or just UI removal for now since delete endpoint might not exist
    // For now just console log
    console.log("Delete event", id);
    // api.deleteEvent(id) // If you have this
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Schedule Event</DialogTitle>
          <DialogDescription>Schedule a new event for specific roles.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...form.register("facility_id")} />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
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
                    <FormItem>
                      <FormLabel>Event Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="information">Information Event</SelectItem>
                          <SelectItem value="invite">Invite Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Information: Students can mark presence. Invite: Students must join to participate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "invite" && (
                  <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Fee (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormDescription>Enter 0 if the event is free.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recipient_roles"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Recipients *</FormLabel>
                      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={roleOpen}
                              className="w-full justify-between"
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} roles selected`
                                : "Select roles..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command className="w-full">
                            <CommandInput placeholder="Search roles..." />
                            <CommandList>
                              <CommandEmpty>No role found.</CommandEmpty>
                              <CommandGroup>
                                {rolesList.map((role) => (
                                  <CommandItem
                                    key={role.id}
                                    value={role.label}
                                    onSelect={() => {
                                      const current = field.value || [];
                                      const isSelected = current.includes(role.id);
                                      const updated = isSelected
                                        ? current.filter((value) => value !== role.id)
                                        : [...current, role.id];
                                      field.onChange(updated);
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        field.value?.includes(role.id)
                                          ? "bg-primary text-primary-foreground"
                                          : "opacity-50 [&_svg]:invisible"
                                      )}
                                    >
                                      <Check className={cn("h-4 w-4")} />
                                    </div>
                                    {role.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value?.map((roleId) => {
                          const role = rolesList.find((r) => r.id === roleId);
                          return role ? (
                            <Badge key={roleId} variant="secondary" className="relative z-0">
                              {role.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showDepartment && (
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Department (Optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Only for selected Students/Teachers.</FormDescription>
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
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
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
                      <FormItem>
                        <FormLabel>Time *</FormLabel>
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
                  render={({ field }) => {
                    // Determine select value based on current field value
                    const isCustom =
                      field.value && !facilities.some((f) => f.fullName === field.value);
                    const selectValue = isCustom ? "custom" : field.value || undefined;

                    return (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          value={selectValue}
                          onValueChange={(val) => {
                            if (val === "custom") {
                              field.onChange(""); // Clear for typing
                              form.setValue("facility_id", null);
                            } else {
                              field.onChange(val);
                              const facility = facilities.find((f) => f.fullName === val);
                              if (facility) {
                                form.setValue("facility_id", facility.id);
                              } else {
                                form.setValue("facility_id", null);
                              }
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {facilities.map((fac) => (
                              <SelectItem key={fac.id} value={fac.fullName}>
                                {fac.fullName}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Other (Enter manually)</SelectItem>
                          </SelectContent>
                        </Select>

                        {selectValue === "custom" && (
                          <div className="mt-2 animate-fade-in-up" aria-live="polite">
                            <Input
                              placeholder="Enter custom location..."
                              aria-label="Custom location"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter event details..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule Event</Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Right Column: Scheduled Events List */}
          <div className="border-l pl-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Scheduled Events</h3>
            </div>
            <ScrollArea className="h-[500px] w-full pr-4">
              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No events scheduled yet.
                  </p>
                ) : (
                  events.map((event, index) => (
                    <div
                      key={event.id || index}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {event.date}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {event.recipient_roles?.map((role, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize"
                          >
                            {role.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.time} @ {event.location}
                      </p>
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
