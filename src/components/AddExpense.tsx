import { useState, useEffect } from 'react';
import { Group, SplitType, ExpenseCategory } from '../types';
import { useAppContext } from '../store';

export default function AddExpense({ group, onAdded, editExpenseId, onCancel }: { group: Group, onAdded: () => void, editExpenseId?: string | null, onCancel?: () => void }) {
  const { dispatch } = useAppContext();
  
  const existingExpense = editExpenseId ? group.expenses.find(e => e.id === editExpenseId) : null;

  const [description, setDescription] = useState(existingExpense?.description || '');
  const [amount, setAmount] = useState<number | ''>(existingExpense?.amount || '');
  const [paidBy, setPaidBy] = useState(existingExpense?.paidBy || group.members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>(existingExpense?.splitType || 'EQUAL');
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category || 'Others');
  const [date, setDate] = useState(existingExpense?.date ? new Date(existingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  // Members selected for equal split
  const getInitialSelectedMembers = (): Set<string> => {
    if (existingExpense && existingExpense.splitType === 'EQUAL') {
      // Members who had a non-zero split are the ones that were selected
      const selected = Object.entries(existingExpense.splits)
        .filter(([_, val]) => val > 0.001)
        .map(([id]) => id);
      return new Set(selected.length > 0 ? selected : group.members.map(m => m.id));
    }
    return new Set(group.members.map(m => m.id));
  };
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(getInitialSelectedMembers);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // must keep at least 1
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Custom split modes
  const [customMode, setCustomMode] = useState<'EXACT' | 'PERCENTAGE'>('EXACT');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>(existingExpense?.splitType === 'CUSTOM' ? existingExpense.splits : {});
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (existingExpense && existingExpense.splitType === 'CUSTOM') {
      const totalAmount = existingExpense.amount;
      const percentages: Record<string, number> = {};
      Object.entries(existingExpense.splits).forEach(([memberId, splitAmt]) => {
        percentages[memberId] = totalAmount > 0 ? (splitAmt / totalAmount) * 100 : 0;
      });
      setCustomPercentages(percentages);
    }
  }, [existingExpense]);

  const handleCustomChange = (memberId: string, val: string) => {
    const num = parseFloat(val) || 0;
    if (customMode === 'EXACT') {
      setCustomSplits(prev => ({ ...prev, [memberId]: num }));
    } else {
      setCustomPercentages(prev => ({ ...prev, [memberId]: num }));
    }
  };

  const calculateCustomTotal = () => {
    return Object.values(customSplits).reduce((a, b) => a + b, 0);
  };

  const calculatePercentageTotal = () => {
    return Object.values(customPercentages).reduce((a, b) => a + b, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return;

    let finalSplits: Record<string, number> = {};

    if (splitType === 'EQUAL') {
      const selected = group.members.filter(m => selectedMembers.has(m.id));
      const splitAmount = Number(amount) / selected.length;
      group.members.forEach(m => {
        finalSplits[m.id] = selectedMembers.has(m.id) ? splitAmount : 0;
      });
    } else {
      if (customMode === 'EXACT') {
        const total = calculateCustomTotal();
        // Allow a small margin of error for exact splits
        if (Math.abs(total - Number(amount)) > 0.05) {
          alert(`Split amounts must equal total amount. Current sum: ${total}`);
          return;
        }
        finalSplits = { ...customSplits };
        // fill unassigned with 0
        group.members.forEach(m => {
          if (finalSplits[m.id] === undefined) finalSplits[m.id] = 0;
        });
      } else {
        const totalPct = calculatePercentageTotal();
        if (Math.abs(totalPct - 100) > 0.1) {
          alert(`Percentages must sum to 100%. Current sum: ${totalPct}%`);
          return;
        }
        group.members.forEach(m => {
          finalSplits[m.id] = (Number(amount) * (customPercentages[m.id] || 0)) / 100;
        });
      }
    }

    if (existingExpense) {
      dispatch({
        type: 'EDIT_EXPENSE',
        payload: {
          groupId: group.id,
          expense: {
            ...existingExpense,
            description,
            amount: Number(amount),
            paidBy,
            date: new Date(date).toISOString(),
            category,
            splitType,
            splits: finalSplits,
          }
        }
      });
    } else {
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          groupId: group.id,
          expense: {
            id: crypto.randomUUID(),
            description,
            amount: Number(amount),
            paidBy,
            date: new Date(date).toISOString(),
            category,
            splitType,
            splits: finalSplits,
          }
        }
      });
    }

    onAdded();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>{existingExpense ? 'Edit Expense' : 'Add an Expense'}</h3>
        {existingExpense && onCancel && (
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={onCancel}>Cancel</button>
        )}
      </div>
      
      <div className="form-group">
        <label className="form-label">Description</label>
        <input 
          type="text" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="e.g., Dinner at Cafe" 
          required 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Total Amount</label>
        <input 
          type="number" 
          min="0.01" 
          step="0.01" 
          value={amount} 
          onChange={e => setAmount(parseFloat(e.target.value))} 
          placeholder="0.00" 
          required 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Date</label>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          required 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Paid By</label>
        <select value={paidBy} onChange={e => setPaidBy(e.target.value)}>
          {group.members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
          <option value="Food">Food</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Travel">Travel</option>
          <option value="Hotels">Hotels</option>
          <option value="Others">Others</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Split Method</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="splitType" 
              checked={splitType === 'EQUAL'} 
              onChange={() => setSplitType('EQUAL')} 
            /> Equal
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="splitType" 
              checked={splitType === 'CUSTOM'} 
              onChange={() => setSplitType('CUSTOM')} 
            /> Custom
          </label>
        </div>
      </div>

      {splitType === 'EQUAL' && (
        <div style={{ background: 'var(--surface-glass)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div className="form-label" style={{ marginBottom: '0.75rem' }}>Split Between</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.members.map(m => (
              <label key={m.id} className="flex-between" style={{ cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: selectedMembers.has(m.id) ? 'var(--surface-hover)' : 'transparent', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(m.id)}
                    onChange={() => toggleMember(m.id)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontWeight: selectedMembers.has(m.id) ? 500 : 400, color: selectedMembers.has(m.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.name}</span>
                </div>
                {amount && selectedMembers.has(m.id) && (
                  <span className="tabular-nums" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ₹{(Number(amount) / selectedMembers.size).toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {selectedMembers.size} of {group.members.length} members selected
          </div>
        </div>
      )}

      {splitType === 'CUSTOM' && (
        <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              type="button" 
              className={`btn ${customMode === 'EXACT' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setCustomMode('EXACT')}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
            >
              Exact Amounts
            </button>
            <button 
              type="button" 
              className={`btn ${customMode === 'PERCENTAGE' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setCustomMode('PERCENTAGE')}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
            >
              Percentages
            </button>
          </div>

          {group.members.map(m => (
            <div key={m.id} className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span>{m.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {customMode === 'EXACT' ? '₹' : ''}
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={customMode === 'EXACT' ? (customSplits[m.id] || '') : (customPercentages[m.id] || '')}
                  onChange={e => handleCustomChange(m.id, e.target.value)}
                  style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                  placeholder="0.00"
                />
                {customMode === 'PERCENTAGE' ? '%' : ''}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {customMode === 'EXACT' && (
              <span>Total: ₹{calculateCustomTotal().toFixed(2)} / ₹{Number(amount || 0).toFixed(2)}</span>
            )}
            {customMode === 'PERCENTAGE' && (
              <span>Total: {calculatePercentageTotal().toFixed(2)}% / 100%</span>
            )}
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Expense</button>
    </form>
  );
}
