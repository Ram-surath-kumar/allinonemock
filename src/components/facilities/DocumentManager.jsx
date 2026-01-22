import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    FileText, Image as ImageIcon, File,
    Trash2, ExternalLink, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function DocumentManager({ roomId }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // New Doc State
    const [newDoc, setNewDoc] = useState({
        doc_type: 'Report',
        name: '',
        url: ''
    });

    useEffect(() => {
        if (roomId) fetchDocs();
    }, [roomId]);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/documents/${roomId}`);
            const result = await response.json();
            if (result.data) {
                setDocs(result.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleAddDoc = async () => {
        if (!newDoc.name || !newDoc.url) {
            toast.error("Name and URL are required");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                room_id: roomId,
                ...newDoc
            };

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed");

            toast.success("Document added");
            setNewDoc({ doc_type: 'Report', name: '', url: '' });
            setIsAddOpen(false);
            fetchDocs();

        } catch (error) {
            console.error(error);
            toast.error("Failed to add document");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this document reference?")) return;
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/facilities/documents/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success("Document deleted");
                setDocs(docs.filter(d => d.id !== id));
            }
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Photo': return <ImageIcon className="h-8 w-8 text-purple-500" />;
            case 'Layout': return <FileText className="h-8 w-8 text-blue-500" />;
            case 'Certificate': return <FileText className="h-8 w-8 text-orange-500" />;
            default: return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Attached Files</h3>
                <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Attach Document
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.length === 0 ? (
                    <div className="col-span-full py-8 text-center border rounded-md border-dashed text-muted-foreground text-sm">
                        No documents attached to this room.
                    </div>
                ) : (
                    docs.map(doc => (
                        <Card key={doc.id} className="relative group overflow-hidden hover:bg-muted/30 transition-colors">
                            <CardContent className="p-4 flex items-start space-x-4">
                                <div className="p-2 bg-muted rounded-md shrink-0">
                                    {getIcon(doc.doc_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{doc.doc_type}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center"
                                        >
                                            View <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Attach Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select
                                value={newDoc.doc_type}
                                onValueChange={v => setNewDoc({ ...newDoc, doc_type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Layout">Layout / Blueprint</SelectItem>
                                    <SelectItem value="Photo">Photo</SelectItem>
                                    <SelectItem value="Certificate">Safety Certificate</SelectItem>
                                    <SelectItem value="Report">Maintenance Report</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Document Name</Label>
                            <Input
                                placeholder="e.g. Fire Safety Cert 2025"
                                value={newDoc.name}
                                onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>File URL</Label>
                            <Input
                                placeholder="https://..."
                                value={newDoc.url}
                                onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                * For MVP, please paste a direct link to the file (e.g. Drive, OneDrive, or S3).
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDoc} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Attach
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
