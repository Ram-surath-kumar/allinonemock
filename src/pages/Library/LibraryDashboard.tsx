import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Book, LibraryMember, fetchBooks, issueBook, returnBook, getMember } from '@/services/library';
import { Search, BookOpen, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';

export default function LibraryDashboard() {
    const { toast } = useToast();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Circulation State
    const [memberId, setMemberId] = useState('');
    const [copyId, setCopyId] = useState('');
    const [activeMember, setActiveMember] = useState<LibraryMember | null>(null);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        setLoading(true);
        try {
            const data = await fetchBooks();
            setBooks(data);
        } catch (error) {
            toast({
                title: "Error fetching books",
                description: "Could not load library catalog.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchMember = async () => {
        if (!memberId) return;
        try {
            const member = await getMember(memberId);
            if (member) {
                setActiveMember(member);
                toast({ title: "Member Found", description: `Active: ${member.status}` });
            } else {
                setActiveMember(null);
                toast({ title: "Member Not Found", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch member details", variant: "destructive" });
        }
    };

    const handleIssue = async () => {
        if (!memberId || !copyId) {
            toast({ title: "Validation Error", description: "Member ID and Copy ID are required", variant: "destructive" });
            return;
        }
        try {
            await issueBook(memberId, copyId);
            toast({ title: "Success", description: "Book issued successfully" });
            setCopyId('');
            // Refresh member stats if needed
            if (memberId) handleSearchMember();
        } catch (error: any) {
            toast({ title: "Issue Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleReturn = async () => {
        if (!copyId) {
            toast({ title: "Validation Error", description: "Copy ID is required", variant: "destructive" });
            return;
        }
        try {
            await returnBook(copyId);
            toast({ title: "Success", description: "Book returned successfully" });
            setCopyId('');
        } catch (error: any) {
            toast({ title: "Return Failed", description: error.message, variant: "destructive" });
        }
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
    );

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
                    <p className="text-muted-foreground">Manage books, circulation, and members.</p>
                </div>
            </div>

            <Tabs defaultValue="catalog" className="w-full">
                <TabsList>
                    <TabsTrigger value="catalog">Books Catalog</TabsTrigger>
                    <TabsTrigger value="circulation">Circulation Desk</TabsTrigger>
                </TabsList>

                {/* CATALOG TAB */}
                <TabsContent value="catalog" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Books Repository</CardTitle>
                            <CardDescription>View and manage library inventory.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Title, Author, or ISBN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button variant="outline" size="icon" onClick={loadBooks} disabled={loading}>
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ISBN</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Publisher</TableHead>
                                            <TableHead>Category</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBooks.length > 0 ? (
                                            filteredBooks.map((book) => (
                                                <TableRow key={book.id}>
                                                    <TableCell className="font-mono">{book.isbn}</TableCell>
                                                    <TableCell className="font-medium">{book.title}</TableCell>
                                                    <TableCell>{book.author}</TableCell>
                                                    <TableCell>{book.publisher || '-'}</TableCell>
                                                    <TableCell>{book.category_id || '-'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    {loading ? "Loading books..." : "No books found."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CIRCULATION TAB */}
                <TabsContent value="circulation" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">

                        {/* ISSUE SECTION */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" /> Issue Book
                                </CardTitle>
                                <CardDescription>Issue a book copy to a member.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Member ID</Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="Enter Member ID"
                                            value={memberId}
                                            onChange={(e) => setMemberId(e.target.value)}
                                        />
                                        <Button variant="secondary" onClick={handleSearchMember}>
                                            <UserCheck className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {activeMember && (
                                        <div className="text-sm p-2 bg-muted rounded-md flex justify-between">
                                            <span>Books: {activeMember.current_issued_count}/{activeMember.max_books_limit}</span>
                                            <span className={activeMember.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                                                {activeMember.status}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Book Copy Accession Number / ID</Label>
                                    <Input
                                        placeholder="Scan Barcode or Enter Copy ID"
                                        value={copyId}
                                        onChange={(e) => setCopyId(e.target.value)}
                                    />
                                </div>

                                <Button className="w-full" onClick={handleIssue} disabled={!activeMember || !copyId}>
                                    Confirm Issue
                                </Button>
                            </CardContent>
                        </Card>

                        {/* RETURN SECTION */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5" /> Return Book
                                </CardTitle>
                                <CardDescription>Process book returns.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Book Copy Accession Number / ID</Label>
                                    <Input
                                        placeholder="Scan Barcode or Enter Copy ID"
                                        value={copyId}
                                        onChange={(e) => setCopyId(e.target.value)}
                                    />
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800 text-sm flex gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <p>Late returns will automatically generate fines based on the overdue duration.</p>
                                </div>

                                <Button variant="outline" className="w-full" onClick={handleReturn} disabled={!copyId}>
                                    Process Return
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
