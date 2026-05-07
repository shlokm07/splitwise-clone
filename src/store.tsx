import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction } from './types';

const LOCAL_STORAGE_KEY = 'splitwise_clone_state';

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state from local storage', e);
  }
  return { groups: [], theme: 'dark' };
};

const initialState: AppState = loadState();

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
      
    case 'EDIT_GROUP_NAME':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, name: action.payload.name }
            : g
        ),
      };

    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] };
    case 'DELETE_GROUP':
      return { ...state, groups: state.groups.filter(g => g.id !== action.payload.groupId) };

    case 'DELETE_MEMBER':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, members: g.members.filter(m => m.id !== action.payload.memberId) }
            : g
        ),
      };
      
    case 'ADD_MEMBER':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, members: [...g.members, action.payload.member] }
            : g
        ),
      };

    case 'ADD_EXPENSE':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, expenses: [...g.expenses, action.payload.expense] }
            : g
        ),
      };

    case 'EDIT_EXPENSE':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? {
                ...g,
                expenses: g.expenses.map(e =>
                  e.id === action.payload.expense.id ? action.payload.expense : e
                ),
              }
            : g
        ),
      };

    case 'DELETE_EXPENSE':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? {
                ...g,
                expenses: g.expenses.filter(e => e.id !== action.payload.expenseId),
              }
            : g
        ),
      };

    case 'SETTLE_UP': {
      const { groupId, payerId, payeeId, amount } = action.payload;
      const settleExpense = {
        id: crypto.randomUUID(),
        description: 'Settle Up',
        amount: amount,
        paidBy: payerId,
        date: new Date().toISOString(),
        splitType: 'CUSTOM' as const,
        splits: { [payeeId]: amount }, // Payee owes the Payer the settle amount (cancels out)
      };
      
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, expenses: [...g.expenses, settleExpense] }
            : g
        ),
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to local storage', e);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
