import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Search, Edit2, Shield } from "lucide-react";
import { ROLE_HIERARCHY, ROLE_LABELS } from "@/types/erp";

export const TeamSettings = ({ currentUser }) => {
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter roles that are strictly below the current user's level
  const currentUserLevel = ROLE_HIERARCHY[currentUser?.role];

  // Function to determine if a user can supervise another
  const canSupervise = (targetRole) => {
    if (!targetRole) return false;
    const targetLevel = ROLE_HIERARCHY[targetRole];
    // Check if hierarchy levels are defined
    if (currentUserLevel === undefined || targetLevel === undefined) return false;
    // Higher number means lower rank in ROLE_HIERARCHY (1 is Admin, 5 is Student)
    return currentUserLevel < targetLevel;
  };

  useEffect(() => {
    const fetchSubordinates = async () => {
      // For a real app, you might want a specific API endpoint like /users/subordinates
      // optimization: fetch all users and filter client-side for now, as API might not support complex hierarchy queries
      try {
        // Fetch users. In a large system, this should be paginated and filtered on server.
        const response = await api.getUsers({ limit: 100 });
        if (response.data) {
          const filtered = response.data.filter((u) => canSupervise(u.role));
          setSubordinates(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch team", error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSubordinates();
    }
  }, [currentUser]);

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await api.updateUser(editingUser.id, {
        name: editingUser.name,
        department: editingUser.department,
        designation: editingUser.designation,
        phone: editingUser.phone,
        dob: editingUser.dob,
        gender: editingUser.gender,
        blood_group: editingUser.blood_group,
      });

      if (response.error) throw new Error(response.error);

      toast.success("Team member updated successfully");
      setSubordinates((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...editingUser } : u))
      );
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update member");
    }
  };

  const filteredSubordinates = subordinates.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>
          Manage information for members under your supervision. You can edit details for:{" "}
          {Object.entries(ROLE_HIERARCHY)
            .filter(([role, level]) => level > currentUserLevel)
            .map(([role]) => ROLE_LABELS[role])
            .join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading team members...
                  </TableCell>
                </TableRow>
              ) : filteredSubordinates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No team members found under your supervision.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubordinates.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={isDialogOpen && editingUser?.id === user.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (open) setEditingUser({ ...user });
                          else setEditingUser(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Team Member</DialogTitle>
                            <DialogDescription>Update details for {user.name}.</DialogDescription>
                          </DialogHeader>
                          {editingUser && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                  Name
                                </Label>
                                <Input
                                  id="name"
                                  value={editingUser.name || ""}
                                  onChange={(e) =>
                                    setEditingUser({ ...editingUser, name: e.target.value })
                                  }
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="department" className="text-right">
                                  Department
                                </Label>
                                <Input
                                  id="department"
                                  value={editingUser.department || ""}
                                  onChange={(e) =>
                                    setEditingUser({ ...editingUser, department: e.target.value })
                                  }
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="designation" className="text-right">
                                  Designation
                                </Label>
                                <Input
                                  id="designation"
                                  value={editingUser.designation || ""}
                                  onChange={(e) =>
                                    setEditingUser({ ...editingUser, designation: e.target.value })
                                  }
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                  Phone
                                </Label>
                                <Input
                                  id="phone"
                                  value={editingUser.phone || ""}
                                  onChange={(e) =>
                                    setEditingUser({ ...editingUser, phone: e.target.value })
                                  }
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dob" className="text-right">
                                  DOB
                                </Label>
                                <Input
                                  id="dob"
                                  type="date"
                                  value={editingUser.dob || ""}
                                  onChange={(e) =>
                                    setEditingUser({ ...editingUser, dob: e.target.value })
                                  }
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="gender" className="text-right">
                                  Gender
                                </Label>
                                <div className="col-span-3">
                                  <Select
                                    value={editingUser.gender || ""}
                                    onValueChange={(value) =>
                                      setEditingUser({ ...editingUser, gender: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="blood_group" className="text-right">
                                  Blood Group
                                </Label>
                                <div className="col-span-3">
                                  <Select
                                    value={editingUser.blood_group || ""}
                                    onValueChange={(value) =>
                                      setEditingUser({ ...editingUser, blood_group: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select blood group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                                        (bg) => (
                                          <SelectItem key={bg} value={bg}>
                                            {bg}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" onClick={handleEditSave}>
                              Save changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
