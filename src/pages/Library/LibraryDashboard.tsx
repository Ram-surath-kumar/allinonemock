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
import { Book, LibraryMember, fetchBooks, issueBook, returnBook, getMember, addBook } from '@/services/library';
import { Search, BookOpen, RefreshCw, UserCheck, AlertCircle, Upload, Sparkles } from 'lucide-react';
import { analyzeBookCover } from '@/services/gemini';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RippleLoader } from "@/components/ui/RippleLoader";

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

    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    const [entryMode, setEntryMode] = useState<'manual' | 'ai'>('manual');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        isbn: '',
        category: '',
        publisher: '',
        quantity: '1'
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCoverImage(file);
        setAiProcessing(true);

        try {
            const metadata = await analyzeBookCover(file);
            setExtractedData(metadata);

            // Auto-fill form with extracted data
            setNewBook({
                title: metadata.title || '',
                author: metadata.author || '',
                isbn: '', // ISBN will be auto-generated
                category: metadata.category || '',
                publisher: metadata.publisher || '',
                quantity: '1'
            });

            toast({
                title: "AI Analysis Complete",
                description: `Extracted: ${metadata.title} by ${metadata.author}`,
            });
        } catch (error: any) {
            toast({
                title: "AI Analysis Failed",
                description: error.message || "Failed to analyze book cover. Please enter manually.",
                variant: "destructive"
            });
        } finally {
            setAiProcessing(false);
        }
    };

    const handleRemoveImage = () => {
        setCoverImage(null);
        setExtractedData(null);
        setNewBook({
            title: '',
            author: '',
            isbn: '',
            category: '',
            publisher: '',
            quantity: '1'
        });
    };

    const handleAddBook = async () => {
        if (!newBook.title || !newBook.author) {
            toast({ title: "Validation Error", description: "Title and Author are required.", variant: "destructive" });
            return;
        }

        try {
            await addBook({
                ...newBook,
                is_reference_only: false // Default
            });
            toast({ title: "Success", description: "Book added successfully. ISBN auto-generated if not provided." });
            setIsAddBookOpen(false);
            setNewBook({ title: '', author: '', isbn: '', category: '', publisher: '', quantity: '1' });
            setCoverImage(null);
            setExtractedData(null);
            setEntryMode('manual');
            loadBooks();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to add book", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
                    <p className="text-muted-foreground">Manage books, circulation, and members.</p>
                </div>
                <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <BookOpen className="mr-2 h-4 w-4" /> Add Book
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Book</DialogTitle>
                            <DialogDescription>
                                Choose manual entry or use AI to extract details from book cover.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Entry Mode Toggle */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                            <Button
                                variant={entryMode === 'manual' ? 'default' : 'ghost'}
                                className="flex-1"
                                onClick={() => setEntryMode('manual')}
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Manual Entry
                            </Button>
                            <Button
                                variant={entryMode === 'ai' ? 'default' : 'ghost'}
                                className="flex-1"
                                onClick={() => setEntryMode('ai')}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                AI-Assisted
                            </Button>
                        </div>

                        {/* AI Mode - Image Upload */}
                        {entryMode === 'ai' && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center relative">
                                    {coverImage && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={handleRemoveImage}
                                        >
                                            <span className="text-lg">×</span>
                                        </Button>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="cover-upload"
                                        disabled={aiProcessing}
                                    />
                                    <label htmlFor="cover-upload" className="cursor-pointer">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">
                                            {coverImage ? coverImage.name : 'Upload Book Cover'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            AI will extract title, author, and other details
                                        </p>
                                    </label>
                                </div>
                                {aiProcessing && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Analyzing book cover with AI...
                                    </div>
                                )}
                                {extractedData && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                        <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                            ✓ AI Extraction Complete (Confidence: {Math.round(extractedData.confidence * 100)}%)
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            You can review and edit the extracted information below
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={newBook.title}
                                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author">Author *</Label>
                                <Input
                                    id="author"
                                    value={newBook.author}
                                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="isbn">ISBN (Auto-generated if empty)</Label>
                                    <Input
                                        id="isbn"
                                        value={newBook.isbn}
                                        onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                                        placeholder="Leave empty for auto-generation"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={newBook.quantity}
                                        onChange={(e) => setNewBook({ ...newBook, quantity: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={newBook.category}
                                        onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                                        placeholder="e.g. Fiction, Science"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="publisher">Publisher</Label>
                                    <Input
                                        id="publisher"
                                        value={newBook.publisher}
                                        onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddBookOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddBook}>Add Book</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-64">
                                                    <RippleLoader />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredBooks.length > 0 ? (
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
                                                    No books found.
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
