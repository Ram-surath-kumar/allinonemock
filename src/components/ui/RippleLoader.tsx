import { cn } from "@/lib/utils";

export function RippleLoader({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full h-full p-4 overflow-hidden", className)}>
            <div className="relative flex items-center justify-center">
                {/* Central core */}
                <div className="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)] z-10 animate-pulse" />

                {/* Ripple rings - Adjusted for smoother, larger expansion */}
                <div className="absolute w-20 h-20 animate-ripple rounded-full border border-primary/40 opacity-0" style={{ animationDelay: '0s' }} />
                <div className="absolute w-20 h-20 animate-ripple rounded-full border border-primary/40 opacity-0" style={{ animationDelay: '1s' }} />
                <div className="absolute w-20 h-20 animate-ripple rounded-full border border-primary/40 opacity-0" style={{ animationDelay: '2s' }} />
            </div>

            {/* Elegant loading text */}
            <p className="mt-16 text-sm text-muted-foreground/80 font-medium tracking-[0.2em] uppercase animate-pulse">
                Loading
            </p>
        </div>
    );
}
