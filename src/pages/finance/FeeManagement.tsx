import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function FeeManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [heads, setHeads] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catRes, headRes, structRes] = await Promise.all([
                api.getFeeCategories(),
                api.getFeeHeads(),
                api.getFeeStructures()
            ]);
            if (catRes.data) setCategories(catRes.data);
            if (headRes.data) setHeads(headRes.data);
            if (structRes.data) setStructures(structRes.data);
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
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="heads">Fee Heads</TabsTrigger>
                    <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                    <TabsTrigger value="assignments">Fee Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="structures" className="space-y-4">
                    <FeeStructuresTab structures={structures} categories={categories} heads={heads} refresh={loadData} />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoriesTab categories={categories} refresh={loadData} />
                </TabsContent>

                <TabsContent value="heads" className="space-y-4">
                    <HeadsTab heads={heads} refresh={loadData} />
                </TabsContent>

                <TabsContent value="scholarships" className="space-y-4">
                    <ScholarshipsTab scholarships={scholarships} refresh={loadData} />
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                    <AssignmentsTab structures={structures} scholarships={scholarships} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CategoriesTab({ categories, refresh }: { categories: any[], refresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = async () => {
        const res = await api.createFeeCategory({ name, description: desc });
        if (res.data) {
            toast.success("Category created");
            setIsOpen(false);
            setName(''); setDesc('');
            refresh();
        } else {
            toast.error(res.error || "Failed to create category");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Fee Categories</CardTitle>
                    <CardDescription>Manage student fee categories (e.g., General, OBC)</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Fee Category</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. General" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={desc} onChange={e => setDesc(e.target.value)} />
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
                        <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function HeadsTab({ heads, refresh }: { heads: any[], refresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('tuition');

    const handleSubmit = async () => {
        const res = await api.createFeeHead({ name, type });
        if (res.data) {
            toast.success("Fee Head created");
            setIsOpen(false);
            setName(''); setType('tuition');
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
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Fee Head</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Fee Head</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tuition Fee" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {heads.map(h => (
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

function FeeStructuresTab({ structures, categories, heads, refresh }: { structures: any[], categories: any[], heads: any[], refresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    // Form State
    const [name, setName] = useState('');
    const [batchYear, setBatchYear] = useState(new Date().getFullYear().toString());
    const [semester, setSemester] = useState('1');
    const [categoryId, setCategoryId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState<{ head_id: string, amount: number }[]>([]);

    const addItem = () => setItems([...items, { head_id: '', amount: 0 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    };
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const handleSubmit = async () => {
        if (!name || !batchYear || !categoryId || !dueDate) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = {
            name,
            batch_year: parseInt(batchYear),
            semester,
            category_id: categoryId,
            due_date: dueDate,
            total_amount: totalAmount,
            items: items.filter(i => i.head_id && i.amount > 0)
        };

        const res = await api.createFeeStructure(payload);
        if (res.data) {
            toast.success("Structure created");
            setIsOpen(false);
            refresh();
            // Reset form
            setName(''); setItems([]);
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
                        <Button><Plus className="mr-2 h-4 w-4" /> Create Structure</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Structure Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 10 - Gen" />
                            </div>
                            <div className="space-y-2">
                                <Label>Batch Year</Label>
                                <Input value={batchYear} onChange={e => setBatchYear(e.target.value)} type="number" />
                            </div>
                            <div className="space-y-2">
                                <Label>Semester/Term</Label>
                                <Input value={semester} onChange={e => setSemester(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" />
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                                <Label>Fee Components</Label>
                                <Button variant="outline" size="sm" onClick={addItem}>Add Component</Button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Select value={item.head_id} onValueChange={v => updateItem(index, 'head_id', v)}>
                                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Head" /></SelectTrigger>
                                            <SelectContent>
                                                {heads.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            value={item.amount}
                                            onChange={e => updateItem(index, 'amount', parseFloat(e.target.value))}
                                            placeholder="Amount"
                                            className="w-[120px]"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right font-bold mt-2">
                                Total: {totalAmount}
                            </div>
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
                            <TableHead>Category</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {structures.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.category?.name}</TableCell>
                                <TableCell>{s.batch_year} - {s.semester}</TableCell>
                                <TableCell>{s.total_amount}</TableCell>
                                <TableCell>{new Date(s.due_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function AssignmentsTab({ structures, scholarships }: { structures: any[], scholarships: any[] }) {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStructure, setSelectedStructure] = useState('');
    const [selectedScholarship, setSelectedScholarship] = useState('none');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getUsers({ role: 'student' }).then(res => res.data && setStudents(res.data));
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
            scholarship_id: selectedScholarship === 'none' ? null : selectedScholarship
        });
        setLoading(false);

        if (res.data) toast.success("Fee structure assigned successfully");
        else toast.error(res.error || "Assignment failed");
    };

    return (
        <Card>
            <CardHeader><CardTitle>Assign Fees</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-xl">
                <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger><SelectValue placeholder="Search student..." /></SelectTrigger>
                        <SelectContent>
                            {students.slice(0, 50).map(s => ( // Limit to 50 for performance
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Select Fee Structure</Label>
                    <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                        <SelectTrigger><SelectValue placeholder="Select structure..." /></SelectTrigger>
                        <SelectContent>
                            {structures.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} - {s.total_amount}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Apply Scholarship (Optional)</Label>
                    <Select value={selectedScholarship} onValueChange={setSelectedScholarship}>
                        <SelectTrigger><SelectValue placeholder="No Scholarship" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {scholarships.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.type === 'percentage' ? `${s.value}%` : s.value})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAssign} disabled={loading}>Assign Fee</Button>
            </CardContent>
        </Card>
    );
}

function ScholarshipsTab({ scholarships, refresh }: { scholarships: any[], refresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('percentage');
    const [value, setValue] = useState('');
    const [criteria, setCriteria] = useState('');

    const handleSubmit = async () => {
        const res = await api.createScholarship({ name, type, value: parseFloat(value), criteria });
        if (res.data) {
            toast.success("Scholarship created");
            setIsOpen(false);
            setName(''); setValue(''); setCriteria('');
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
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Scholarship</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Scholarship</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Merit Scholarship" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 20 or 5000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Criteria / Description</Label>
                                <Input value={criteria} onChange={e => setCriteria(e.target.value)} />
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
                        <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Criteria</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {scholarships.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="capitalize">{s.type.replace('_', ' ')}</TableCell>
                                <TableCell>{s.value}{s.type === 'percentage' ? '%' : ''}</TableCell>
                                <TableCell>{s.criteria}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
