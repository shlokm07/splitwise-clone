export type Member = {
  id: string;
  name: string;
};

export type SplitType = 'EQUAL' | 'CUSTOM';
export type ExpenseCategory = 'Food' | 'Entertainment' | 'Travel' | 'Hotels' | 'Others';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // Member ID
  date: string;
  category?: ExpenseCategory;
  splitType: SplitType;
  splits: Record<string, number>; // Member ID -> Amount they owe for this expense
};

export type Group = {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
};

export type AppState = {
  groups: Group[];
  theme: 'dark' | 'light';
};

export type AppAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'EDIT_GROUP_NAME'; payload: { groupId: string; name: string } }
  | { type: 'DELETE_GROUP'; payload: { groupId: string } }
  | { type: 'ADD_MEMBER'; payload: { groupId: string; member: Member } }
  | { type: 'DELETE_MEMBER'; payload: { groupId: string; memberId: string } }
  | { type: 'ADD_EXPENSE'; payload: { groupId: string; expense: Expense } }
  | { type: 'EDIT_EXPENSE'; payload: { groupId: string; expense: Expense } }
  | { type: 'DELETE_EXPENSE'; payload: { groupId: string; expenseId: string } }
  | { type: 'SETTLE_UP'; payload: { groupId: string; payerId: string; payeeId: string; amount: number } };
