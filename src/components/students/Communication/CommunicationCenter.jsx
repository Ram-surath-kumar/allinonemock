import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, History } from 'lucide-react';
import { toast } from 'sonner';

export function CommunicationCenter() {
    const [recipientType, setRecipientType] = useState('all');
    const [messageType, setMessageType] = useState('email');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    // Mock list of logs
    const [logs, setLogs] = useState([
        { id: 1, type: 'email', recipient: 'All Students', subject: 'Examination Schedule', sentAt: new Date().toISOString(), status: 'sent' }
    ]);

    const handleSend = async () => {
        if (!content) return toast.error('Content is required');
        if (messageType === 'email' && !subject) return toast.error('Subject is required');

        setSending(true);
        try {
            // In a real app, this would call the API to send bulk messages
            // For now we simulate an API call
            await new Promise(r => setTimeout(r, 1000));

            const newLog = {
                id: Date.now(),
                type: messageType,
                recipient: recipientType === 'all' ? 'All Students' : 'Selected Group',
                subject: subject || '(No Subject)',
                sentAt: new Date().toISOString(),
                status: 'sent'
            };

            setLogs([newLog, ...logs]);
            toast.success('Message sent successfully');
            setContent('');
            setSubject('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Compose Message</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Recipient</label>
                                <Select value={recipientType} onValueChange={setRecipientType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Students</SelectItem>
                                        <SelectItem value="department">By Department</SelectItem>
                                        <SelectItem value="year">By Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Channel</label>
                                <Select value={messageType} onValueChange={setMessageType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="push">Push Notification</SelectItem>
                                        <SelectItem value="portal">Portal Announcement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {messageType === 'email' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Important Update" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Content</label>
                            <Textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Type your message here..."
                                className="min-h-[150px]"
                            />
                        </div>

                        <Button onClick={handleSend} disabled={sending} className="w-full">
                            {sending ? 'Sending...' : 'Send Message'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card className="h-full">
                    <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Recent Logs</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="border-b pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm">{log.type.toUpperCase()}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(log.sentAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-medium line-clamp-1">{log.subject}</p>
                                    <p className="text-xs text-muted-foreground">To: {log.recipient}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
