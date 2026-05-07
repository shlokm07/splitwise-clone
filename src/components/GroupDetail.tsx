import { useState } from 'react';
import { useAppContext } from '../store';
import { ArrowLeft, Edit2, Check, X, Download } from 'lucide-react';
import { exportGroupToCSV } from '../utils';
import ExpenseList from './ExpenseList';
import Balances from './Balances';
import AddExpense from './AddExpense';
import SettleUp from './SettleUp';
import MembersList from './MembersList';
import GraphView from './GraphView';

type Props = {
  groupId: string;
  onBack: () => void;
};

type Tab = 'EXPENSES' | 'BALANCES' | 'SETTLE' | 'MEMBERS' | 'GRAPH' | 'ADD_EXPENSE';

export default function GroupDetail({ groupId, onBack }: Props) {
  const { state, dispatch } = useAppContext();
  const group = state.groups.find(g => g.id === groupId);
  const [activeTab, setActiveTab] = useState<Tab>('EXPENSES');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  if (!group) return null;

  return (
    <div className="fade-in">
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ marginBottom: '2rem' }}>
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', padding: '0.25rem 0.5rem' }}
              autoFocus
            />
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem' }}
              onClick={() => {
                if (newName.trim()) {
                  dispatch({ type: 'EDIT_GROUP_NAME', payload: { groupId, name: newName.trim() } });
                  setIsEditingName(false);
                }
              }}
            >
              <Check size={18} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem' }}
              onClick={() => setIsEditingName(false)}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--accent-color)', margin: 0 }}>{group.name}</h2>
              <button 
                className="btn" 
                style={{ padding: '0.25rem', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setNewName(group.name);
                  setIsEditingName(true);
                }}
                title="Edit Group Name"
              >
                <Edit2 size={16} />
              </button>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => exportGroupToCSV(group)}
              title="Export to CSV"
            >
              <Download size={16} /> Export
            </button>
          </div>
        )}
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>
          {group.members.map(m => m.name).join(', ')}
        </p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'EXPENSES' ? 'active' : ''}`}
          onClick={() => setActiveTab('EXPENSES')}
        >
          Expenses
        </button>
        <button 
          className={`tab ${activeTab === 'BALANCES' ? 'active' : ''}`}
          onClick={() => setActiveTab('BALANCES')}
        >
          Balances
        </button>
        <button 
          className={`tab ${activeTab === 'SETTLE' ? 'active' : ''}`}
          onClick={() => setActiveTab('SETTLE')}
        >
          Settle Up
        </button>
        <button 
          className={`tab ${activeTab === 'MEMBERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('MEMBERS')}
        >
          Members
        </button>
        <button 
          className={`tab ${activeTab === 'GRAPH' ? 'active' : ''}`}
          onClick={() => setActiveTab('GRAPH')}
        >
          Graph
        </button>
        <button 
          className={`tab ${activeTab === 'ADD_EXPENSE' && !editingExpenseId ? 'active pulse' : 'pulse'}`}
          onClick={() => {
            setEditingExpenseId(null);
            setActiveTab('ADD_EXPENSE');
          }}
          style={{ marginLeft: 'auto', color: 'var(--accent-color)' }}
        >
          + Add Expense
        </button>
      </div>

      <div className="fade-in" key={activeTab}>
        {activeTab === 'EXPENSES' && (
          <ExpenseList 
            group={group} 
            onEdit={(id) => {
              setEditingExpenseId(id);
              setActiveTab('ADD_EXPENSE');
            }} 
          />
        )}
        {activeTab === 'BALANCES' && <Balances group={group} />}
        {activeTab === 'SETTLE' && <SettleUp group={group} onSettled={() => setActiveTab('BALANCES')} />}
        {activeTab === 'MEMBERS' && <MembersList group={group} />}
        {activeTab === 'GRAPH' && <GraphView group={group} />}
        {activeTab === 'ADD_EXPENSE' && (
          <AddExpense 
            group={group} 
            editExpenseId={editingExpenseId}
            onAdded={() => {
              setActiveTab('EXPENSES');
              setEditingExpenseId(null);
            }} 
            onCancel={() => {
              setActiveTab('EXPENSES');
              setEditingExpenseId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
