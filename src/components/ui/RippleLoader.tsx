import { cn } from "@/lib/utils";

export function RippleLoader({ className, text = "Loading..." }: { className?: string; text?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-background/50 backdrop-blur-sm", className)}>
            <div className="flex flex-col items-center justify-center gap-4">
                {/* Loop Circles Animation */}
                <div className="relative flex items-center justify-center w-20 h-20">
                    {/* Outer circle - rotates clockwise */}
                    <div className="absolute w-20 h-20 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin-slow" />
                    
                    {/* Middle circle - rotates counter-clockwise */}
                    <div className="absolute w-14 h-14 border-[3px] border-transparent border-b-primary border-l-primary rounded-full animate-spin-reverse" />
                    
                    {/* Inner circle - rotates clockwise */}
                    <div className="absolute w-8 h-8 border-2 border-transparent border-t-primary border-r-primary rounded-full animate-spin-slow" />
                    
                    {/* Center dot */}
                    <div className="absolute w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>

                {/* Loading text below the circles */}
                <p className="text-sm text-primary font-medium tracking-wide">
                    {text}
                </p>
            </div>
        </div>
    );
}
