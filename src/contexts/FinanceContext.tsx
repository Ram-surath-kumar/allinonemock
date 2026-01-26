import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FinanceContextType {
    refreshTrigger: number;
    refreshFinance: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshFinance = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // Listen for global finance refresh events
    useEffect(() => {
        const handleRefresh = () => {
            console.log("FinanceContext - Received refresh event");
            refreshFinance();
        };

        import("@/lib/events").then(({ events, REFRESH_FINANCE }) => {
            events.on(REFRESH_FINANCE, handleRefresh);
        });

        return () => {
            import("@/lib/events").then(({ events, REFRESH_FINANCE }) => {
                events.off(REFRESH_FINANCE, handleRefresh);
            });
        };
    }, [refreshFinance]);

    return (
        <FinanceContext.Provider value={{ refreshTrigger, refreshFinance }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
}
