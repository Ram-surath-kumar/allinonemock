import { MultiTabChat } from "@/components/chat/MultiTabChat";

export function Chat({ onNavigate: _onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {/* Header Section */}
      <div className="shrink-0 pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Chat</h1>
        <p className="text-muted-foreground text-sm">Message and call anyone in your organization</p>
      </div>
      
      {/* Chat Content */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        <MultiTabChat />
      </div>
    </div>
  );
}
