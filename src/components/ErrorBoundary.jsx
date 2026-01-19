import React from 'react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
                    <div className="rounded-xl border border-border bg-card p-8 shadow-depth-2 max-w-lg w-full">
                        <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
                        <p className="text-muted-foreground mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <div className="bg-muted p-4 rounded-md text-left overflow-auto max-h-48 mb-6 text-sm font-mono text-xs">
                            {this.state.error && this.state.error.toString()}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
