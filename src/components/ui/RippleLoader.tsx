import { cn } from "@/lib/utils";

export function RippleLoader({ className, text = "Loading..." }: { className?: string; text?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-background/50 backdrop-blur-sm", className)}>
            <div className="relative flex items-center justify-center w-full max-w-sm aspect-square">
                {/* Central core with intense glow */}
                <div className="absolute w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.8)] z-20 animate-pulse" />

                {/* Multiple Ripple rings for rich effect */}
                <div className="absolute w-full h-full p-20 flex items-center justify-center">
                    <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ripple" />
                    <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ripple animate-ripple-delay-1" />
                    <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ripple animate-ripple-delay-2" />
                </div>
            </div>

            {/* Elegant loading text with glow */}
            <p className="mt-8 text-sm text-primary font-bold tracking-[0.2em] uppercase animate-pulse drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                {text}
            </p>
        </div>
    );
}
