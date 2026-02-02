import { X, FileText, Image as ImageIcon, Video, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AttachmentPreviewProps {
    files: File[];
    onRemove: (index: number) => void;
}

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
    if (files.length === 0) return null;

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return ImageIcon;
        if (file.type.startsWith("video/")) return Video;
        if (file.type.startsWith("audio/")) return Music;
        return FileText;
    };

    const getFileColor = (file: File) => {
        if (file.type.startsWith("image/")) return "text-pink-500 bg-pink-500/10";
        if (file.type.startsWith("video/")) return "text-purple-500 bg-purple-500/10";
        if (file.type.startsWith("audio/")) return "text-orange-500 bg-orange-500/10";
        return "text-blue-500 bg-blue-500/10";
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex flex-wrap gap-2">
                {files.map((file, index) => {
                    const Icon = getFileIcon(file);
                    const colorClass = getFileColor(file);
                    const isImage = file.type.startsWith("image/");

                    return (
                        <div
                            key={index}
                            className="relative group max-w-[200px] bg-background border border-border rounded-lg overflow-hidden"
                        >
                            {isImage ? (
                                <div className="relative">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-full h-32 object-cover"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onRemove(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-3">
                                    <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{file.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => onRemove(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
