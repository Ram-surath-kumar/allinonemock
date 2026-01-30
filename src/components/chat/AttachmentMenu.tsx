import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentMenuProps {
    onFileSelect: (files: FileList, type: "document" | "image" | "video" | "audio") => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AttachmentMenu({
    onFileSelect,
    open,
    onOpenChange,
}: AttachmentMenuProps) {
    const documentInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "document" | "image" | "video" | "audio"
    ) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files, type);
            onOpenChange?.(false);
            // Reset input
            e.target.value = "";
        }
    };

    const menuItems = [
        {
            icon: FileText,
            label: "Document",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            accept: ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx",
            ref: documentInputRef,
            type: "document" as const,
        },
        {
            icon: ImageIcon,
            label: "Photo",
            color: "text-pink-500",
            bgColor: "bg-pink-500/10",
            accept: "image/*",
            ref: imageInputRef,
            type: "image" as const,
        },
        {
            icon: Video,
            label: "Video",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            accept: "video/*",
            ref: videoInputRef,
            type: "video" as const,
        },
        {
            icon: Music,
            label: "Audio",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            accept: "audio/*",
            ref: audioInputRef,
            type: "audio" as const,
        },
    ];

    return (
        <>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                        title="Attach"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="start"
                    className="w-56 p-2"
                >
                    <div className="grid gap-1">
                        {menuItems.map((item) => (
                            <Button
                                key={item.type}
                                variant="ghost"
                                className="w-full justify-start gap-3 h-12"
                                onClick={() => item.ref.current?.click()}
                            >
                                <div className={cn("p-2 rounded-lg", item.bgColor)}>
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <span>{item.label}</span>
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Hidden file inputs */}
            {menuItems.map((item) => (
                <input
                    key={item.type}
                    ref={item.ref}
                    type="file"
                    accept={item.accept}
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e, item.type)}
                />
            ))}
        </>
    );
}
