import { Group } from './types';

// Calculate how much each member owes or is owed in a group
// Positive balance: they are owed money
// Negative balance: they owe money
export function calculateBalances(group: Group): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize balances
  group.members.forEach(m => {
    balances[m.id] = 0;
  });

  group.expenses.forEach(expense => {
    const amount = expense.amount;
    const paidBy = expense.paidBy;

    // Person who paid gets the amount added to their balance
    if (balances[paidBy] !== undefined) {
      balances[paidBy] += amount;
    }

    // Deduct what everyone owes from their balance
    Object.entries(expense.splits).forEach(([memberId, splitAmount]) => {
      if (balances[memberId] !== undefined) {
        balances[memberId] -= splitAmount;
      }
    });
  });

  return balances;
}

// Calculate total balances across all groups by member name
// Assuming member name is a unique identifier across groups for the dashboard
export function calculateGlobalBalances(groups: Group[]): { name: string, balance: number }[] {
  const globalBalances: Record<string, number> = {};

  groups.forEach(group => {
    const balances = calculateBalances(group);
    group.members.forEach(member => {
      if (!globalBalances[member.name]) {
        globalBalances[member.name] = 0;
      }
      globalBalances[member.name] += balances[member.id] || 0;
    });
  });

  return Object.entries(globalBalances).map(([name, balance]) => ({ name, balance }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function exportGroupToCSV(group: Group) {
  const headers = ['Date', 'Category', 'Description', 'Total Amount', 'Paid By', 'Split Details'];
  
  const rows = group.expenses.map(expense => {
    const date = new Date(expense.date).toLocaleDateString();
    const payer = group.members.find(m => m.id === expense.paidBy)?.name || 'Unknown';
    
    const splitDetails = Object.entries(expense.splits)
      .map(([memberId, amount]) => {
        if (amount === 0) return null;
        const memberName = group.members.find(m => m.id === memberId)?.name || 'Unknown';
        return `${memberName}: ${amount.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(' | ');

    const escapeCSV = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    return [
      escapeCSV(date),
      escapeCSV(expense.category || 'Others'),
      escapeCSV(expense.description),
      expense.amount.toFixed(2),
      escapeCSV(payer),
      escapeCSV(splitDetails)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${group.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_expenses.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
