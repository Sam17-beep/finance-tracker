"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';

type Budget = {
  id: string;
  name: string;
  dbPath: string;
};

const BUDGETS: Budget[] = [
  { id: 'my-budget', name: 'Sam', dbPath: 'db.sqlite' },
  { id: 'girlfriend-budget', name: 'Alex', dbPath: 'db_girlfriend.sqlite' },
];

interface ActiveBudgetContextType {
  activeBudgetId: string;
  activeBudget: Budget | undefined;
  budgets: Budget[];
  switchBudget: (budgetId: string) => void;
}

const ActiveBudgetContext = createContext<ActiveBudgetContextType | undefined>(undefined);

export function ActiveBudgetProvider({ children }: { children: React.ReactNode }) {
  const [activeBudgetId, setActiveBudgetId] = useState('my-budget');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeBudgetId');
      if (saved && BUDGETS.some(b => b.id === saved)) setActiveBudgetId(saved);
    }
  }, []);

  const switchBudget = (budgetId: string) => {
    setActiveBudgetId(budgetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeBudgetId', budgetId);
      // Set cookie for server-side access
      document.cookie = `activeBudgetId=${budgetId}; path=/; max-age=31536000`;
      window.location.reload();
    }
  };

  const activeBudget = BUDGETS.find(b => b.id === activeBudgetId);

  return (
    <ActiveBudgetContext.Provider value={{
      activeBudgetId,
      activeBudget,
      budgets: BUDGETS,
      switchBudget,
    }}>
      {children}
    </ActiveBudgetContext.Provider>
  );
}

export function useActiveBudget() {
  const context = useContext(ActiveBudgetContext);
  if (!context) throw new Error('useActiveBudget must be used within an ActiveBudgetProvider');
  return context;
} 