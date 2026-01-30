import { MultiTabChat } from "@/components/chat/MultiTabChat";

export function Chat({ onNavigate: _onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Chat Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-card shadow-sm h-full">
        <MultiTabChat />
      </div>
    </div>
  );
}
