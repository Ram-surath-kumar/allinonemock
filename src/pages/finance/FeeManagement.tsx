import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function FeeManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [heads, setHeads] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, headRes, structRes, deptRes] = await Promise.all([
        api.getFeeCategories(),
        api.getFeeHeads(),
        api.getFeeStructures(),
        api.getDepartments(),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (headRes.data) setHeads(headRes.data);
      if (structRes.data) setStructures(structRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      const scholRes = await api.getScholarships();
      if (scholRes.data) setScholarships(scholRes.data);
    } catch (e) {
      toast.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="structures">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>

          <TabsTrigger value="heads">Fee Heads</TabsTrigger>
          <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          <TabsTrigger value="assignments">Fee Assignments</TabsTrigger>
          <TabsTrigger value="rules">Assignment Rules</TabsTrigger>
          <TabsTrigger value="penalties">Penalty Configs</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="space-y-4">
          <FeeStructuresTab
            structures={structures}
            categories={categories}
            heads={heads}
            refresh={loadData}
          />
        </TabsContent>

        <TabsContent value="heads" className="space-y-4">
          <HeadsTab heads={heads} refresh={loadData} />
        </TabsContent>

        <TabsContent value="scholarships" className="space-y-4">
          <ScholarshipsTab scholarships={scholarships} refresh={loadData} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsTab
            structures={structures}
            scholarships={scholarships}
            departments={departments}
            refresh={loadData}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <AssignmentRulesTab structures={structures} categories={categories} />
        </TabsContent>

        <TabsContent value="penalties" className="space-y-4">
          <PenaltyConfigsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeadsTab({ heads, refresh }: { heads: any[]; refresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("tuition");

  const handleSubmit = async () => {
    const res = await api.createFeeHead({ name, type });
    if (res.data) {
      toast.success("Fee Head created");
      setIsOpen(false);
      setName("");
      setType("tuition");
      refresh();
    } else {
      toast.error(res.error || "Failed to create fee head");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Fee Heads</CardTitle>
          <CardDescription>Components of fee structure (e.g. Tuition, Lab)</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Fee Head
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fee Head</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tuition Fee"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heads.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell className="capitalize">{h.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FeeStructuresTab({
  structures,
  categories,
  heads,
  refresh,
}: {
  structures: any[];
  categories: any[];
  heads: any[];
  refresh: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Form State
  const [name, setName] = useState("");
  const [batchYear, setBatchYear] = useState(new Date().getFullYear().toString());
  const [semester, setSemester] = useState("1");
  // const [categoryId, setCategoryId] = useState(''); // Removed
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<{ head_id: string; amount: number }[]>([]);

  const addItem = () => setItems([...items, { head_id: "", amount: 0 }]);
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleSubmit = async () => {
    if (!name || !batchYear || !dueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name,
      batch_year: parseInt(batchYear),
      semester,
      // category_id: categoryId, // Removed
      due_date: dueDate,
      total_amount: totalAmount,
      items: items.filter((i) => i.head_id && i.amount > 0),
    };

    const res = await api.createFeeStructure(payload);
    if (res.data) {
      toast.success("Structure created");
      setIsOpen(false);
      refresh();
      // Reset form
      setName("");
      setItems([]);
    } else {
      toast.error(res.error || "Failed to create structure");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>Define fees for batches and categories</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Structure Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grade 10 - Gen"
                />
              </div>
              <div className="space-y-2">
                <Label>Batch Year</Label>
                <Input
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>Semester/Term</Label>
                <Input value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <Label>Fee Components</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  Add Component
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={item.head_id}
                      onValueChange={(v) => updateItem(index, "head_id", v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Head" />
                      </SelectTrigger>
                      <SelectContent>
                        {heads.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(index, "amount", parseFloat(e.target.value))}
                      placeholder="Amount"
                      className="w-[120px]"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right font-bold mt-2">Total: ₹{totalAmount}</div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Create Structure</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structures.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  {s.batch_year} - {s.semester}
                </TableCell>
                <TableCell>₹{s.total_amount}</TableCell>
                <TableCell>{new Date(s.due_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AssignmentsTab({
  structures,
  scholarships,
  departments,
  refresh,
}: {
  structures: any[];
  scholarships: any[];
  departments: any[];
  refresh: () => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStructure, setSelectedStructure] = useState("");
  const [selectedScholarship, setSelectedScholarship] = useState("none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getUsers({ role: "student" }).then((res) => res.data && setStudents(res.data));
  }, []);

  const handleAssign = async () => {
    if (!selectedStudent || !selectedStructure) {
      toast.error("Select student and structure");
      return;
    }
    setLoading(true);
    const res = await api.assignFeeStructure({
      student_id: selectedStudent,
      structure_id: selectedStructure,
      scholarship_id: selectedScholarship === "none" ? null : selectedScholarship,
    });
    setLoading(false);

    if (res.data) toast.success("Fee structure assigned successfully");
    else toast.error(res.error || "Assignment failed");
  };

  const handleBulkAssign = async () => {
    if (!selectedDepartment || !selectedStructure) {
      toast.error("Select department and structure");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch students in department
      const usersRes = await api.getUsers({
        role: "student",
        department_id: selectedDepartment
      });

      const studentsInDept = usersRes.data || [];
      if (studentsInDept.length === 0) {
        toast.error("No students found in selected department");
        setLoading(false);
        return;
      }

      const studentIds = studentsInDept.map(s => s.id);

      // 2. Bulk Assign
      const res = await api.assignFeeStructureBulk({
        student_ids: studentIds,
        structure_id: selectedStructure,
        scholarship_id: selectedScholarship === "none" ? null : selectedScholarship,
      });

      if (res.data) {
        toast.success(`Fees assigned to ${res.data.length} students`);
        // Optional: refresh data or show success details
      } else {
        toast.error(res.error || "Bulk assignment failed");
      }
    } catch (e) {
      toast.error("An error occurred during bulk assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <Label>Select Student (Single Assignment)</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Search student..." />
            </SelectTrigger>
            <SelectContent>
              {students.slice(0, 50).map(
                (
                  s // Limit to 50 for performance
                ) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or Bulk Assign by Department</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Department (Bulk Assignment)</Label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Select Fee Structure</Label>
          <Select value={selectedStructure} onValueChange={setSelectedStructure}>
            <SelectTrigger>
              <SelectValue placeholder="Select structure..." />
            </SelectTrigger>
            <SelectContent>
              {structures.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} - {s.total_amount}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Apply Scholarship (Optional)</Label>
          <Select value={selectedScholarship} onValueChange={setSelectedScholarship}>
            <SelectTrigger>
              <SelectValue placeholder="No Scholarship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {scholarships.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.type === "percentage" ? `${s.value}%` : `₹${s.value}`})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleAssign} disabled={loading}>
            Assign Fee
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!selectedStudent) {
                toast.error("Select student first");
                return;
              }
              setLoading(true);
              const res = await api.autoAssignFees(selectedStudent);
              setLoading(false);
              if (res.data) toast.success("Auto-assigned successfully");
              else toast.error(res.error || "Auto-assignment failed");
            }}
            disabled={loading}
          >
            Auto-Assign Best Match
          </Button>

          <Button
            variant="destructive"
            onClick={handleBulkAssign}
            disabled={loading || !selectedDepartment}
          >
            Assign to Department
          </Button>

        </div>
      </CardContent>
    </Card >
  );
}

function ScholarshipsTab({ scholarships, refresh }: { scholarships: any[]; refresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [criteria, setCriteria] = useState("");

  // Rule State
  const [gender, setGender] = useState("any");
  const [min12th, setMin12th] = useState("");
  const [min10th, setMin10th] = useState("");
  const [category, setCategory] = useState("any");
  const [isBPL, setIsBPL] = useState(false);
  const [isPWD, setIsPWD] = useState(false);
  const [isMinority, setIsMinority] = useState(false);
  const [isFirstGraduate, setIsFirstGraduate] = useState(false);

  const handleSubmit = async () => {
    const rules = {
      gender: gender !== "any" ? gender : undefined,
      min_marks_12th: min12th ? parseFloat(min12th) : undefined,
      min_marks_10th: min10th ? parseFloat(min10th) : undefined,
      category: category !== "any" ? category : undefined,
      is_bpl: isBPL ? true : undefined,
      is_pwd: isPWD ? true : undefined,
      minority_community: isMinority ? true : undefined,
      is_first_graduate: isFirstGraduate ? true : undefined,
    };

    // Remove undefined keys
    Object.keys(rules).forEach((key) => rules[key] === undefined && delete rules[key]);

    const res = await api.createScholarship({
      name,
      type,
      value: parseFloat(value),
      criteria,
      rules: Object.keys(rules).length > 0 ? rules : null,
    });

    if (res.data) {
      toast.success("Scholarship created");
      setIsOpen(false);
      // Reset ALL state
      setName("");
      setValue("");
      setCriteria("");
      setGender("any");
      setMin12th("");
      setMin10th("");
      setCategory("any");
      setIsBPL(false);
      setIsPWD(false);
      setIsMinority(false);
      setIsFirstGraduate(false);
      refresh();
    } else {
      toast.error(res.error || "Failed to create scholarship");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Scholarships & Discounts</CardTitle>
          <CardDescription>Manage scholarships and fee concessions</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Scholarship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scholarship</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium border-b pb-2">Basic Info</h4>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Merit Scholarship"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 20 or 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={criteria} onChange={(e) => setCriteria(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium border-b pb-2">Eligibility Rules (Optional)</h4>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="transgender">Transgender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min 12th Marks (%)</Label>
                  <Input
                    type="number"
                    value={min12th}
                    onChange={(e) => setMin12th(e.target.value)}
                    placeholder="e.g. 90"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min 10th Marks (%)</Label>
                  <Input
                    type="number"
                    value={min10th}
                    onChange={(e) => setMin10th(e.target.value)}
                    placeholder="e.g. 85"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC/ST">SC/ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rule_bpl"
                      className="h-4 w-4"
                      checked={isBPL}
                      onChange={(e) => setIsBPL(e.target.checked)}
                    />
                    <Label htmlFor="rule_bpl">Must be Below Poverty Line (BPL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rule_pwd"
                      className="h-4 w-4"
                      checked={isPWD}
                      onChange={(e) => setIsPWD(e.target.checked)}
                    />
                    <Label htmlFor="rule_pwd">Person with Disability (PWD)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rule_minority"
                      className="h-4 w-4"
                      checked={isMinority}
                      onChange={(e) => setIsMinority(e.target.checked)}
                    />
                    <Label htmlFor="rule_minority">Minority Community</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rule_first_grad"
                      className="h-4 w-4"
                      checked={isFirstGraduate}
                      onChange={(e) => setIsFirstGraduate(e.target.checked)}
                    />
                    <Label htmlFor="rule_first_grad">First Graduate</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Criteria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scholarships.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="capitalize">{s.type.replace("_", " ")}</TableCell>
                <TableCell>{s.type === "percentage" ? `${s.value}%` : `₹${s.value}`}</TableCell>
                <TableCell>{s.criteria}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AssignmentRulesTab({ structures, categories }: { structures: any[]; categories: any[] }) {
  const [rules, setRules] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [studentCategory, setStudentCategory] = useState("");
  const [hostelStatus, setHostelStatus] = useState("any");
  const [structureId, setStructureId] = useState("");
  const [priority, setPriority] = useState("1");
  const [numInstallments, setNumInstallments] = useState("2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const res = await api.getAssignmentRules();
    if (res.data) setRules(res.data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!structureId) {
      toast.error("Select structure");
      return;
    }
    const res = await api.createAssignmentRule({
      student_category: studentCategory || null,
      hostel_status: hostelStatus,
      fee_structure_id: structureId,
      priority: parseInt(priority),
      num_installments: parseInt(numInstallments),
    });
    if (res.data) {
      toast.success("Rule created");
      setIsOpen(false);
      loadRules();
    } else {
      toast.error(res.error || "Failed to create rule");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>Rules to automatically match students to fee structures</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student Category (Optional)</Label>
                <Select value={studentCategory} onValueChange={setStudentCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hostel Status</Label>
                <Select value={hostelStatus} onValueChange={setHostelStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="day_scholar">Day Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Select value={structureId} onValueChange={setStructureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority (High = Matches first)</Label>
                  <Input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Installments</Label>
                  <Input
                    type="number"
                    value={numInstallments}
                    onChange={(e) => setNumInstallments(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Hostel</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Inst.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.student_category || "All"}</TableCell>
                <TableCell className="capitalize">{r.hostel_status}</TableCell>
                <TableCell>{r.fee_structures?.name}</TableCell>
                <TableCell>{r.priority}</TableCell>
                <TableCell>{r.num_installments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PenaltyConfigsTab() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const res = await api.getPenaltyConfigs();
    if (res.data) setConfigs(res.data);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Late Fee Configurations</CardTitle>
        <CardDescription>
          Rules for automatically calculating penalties on overdue payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Grace Period</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="capitalize">{c.type.replace("_", " ")}</TableCell>
                <TableCell>₹{c.amount}</TableCell>
                <TableCell>{c.grace_period_days} days</TableCell>
                <TableCell>{c.is_active ? "Active" : "Inactive"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
