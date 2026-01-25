import React, { createContext, useContext, useState, useCallback } from 'react';

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
