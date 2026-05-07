import { useAppContext } from '../store';
import { Group } from '../types';
import { formatCurrency } from '../utils';
import { Edit2, Trash2 } from 'lucide-react';

const getCategoryDetails = (category?: string) => {
  switch (category) {
    case 'Food': return { emoji: '🍔', color: '#4CAF50' };
    case 'Entertainment': return { emoji: '🍿', color: '#9C27B0' };
    case 'Travel': return { emoji: '✈️', color: '#2196F3' };
    case 'Hotels': return { emoji: '🏨', color: '#FF9800' };
    default: return { emoji: '🧾', color: '#9E9E9E' };
  }
};

export default function ExpenseList({ group, onEdit }: { group: Group, onEdit: (id: string) => void }) {
  const { dispatch } = useAppContext();
  if (group.expenses.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p className="text-muted">No expenses yet. Add one to get started!</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedExpenses = [...group.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-col">
      {sortedExpenses.map((expense, index) => {
        const payer = group.members.find(m => m.id === expense.paidBy);
        const date = new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const { emoji, color } = getCategoryDetails(expense.category);
        
        return (
          <div 
            key={expense.id} 
            className="card list-item stagger-item" 
            onClick={() => onEdit(expense.id)}
            style={{ 
              marginBottom: 0, 
              borderLeft: `4px solid ${color}`,
              animationDelay: `${index * 0.05}s`,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                background: 'var(--surface-hover)', 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '1.25rem' 
              }}>
                {emoji}
              </div>
              <div>
                <div className="list-item-title">{expense.description}</div>
                <div className="list-item-subtitle">
                  Paid by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{payer?.name}</span> on {date}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div className="tabular-nums" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {formatCurrency(expense.amount)}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem', border: 'none' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(expense.id); }}
                  title="Edit Expense"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '0.25rem', border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this expense?')) {
                      dispatch({ type: 'DELETE_EXPENSE', payload: { groupId: group.id, expenseId: expense.id } });
                    }
                  }}
                  title="Delete Expense"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
