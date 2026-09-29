import React from 'react';
import { LineItem } from '../../types/invoice';
import { calculateLineItem } from '../../utils/invoiceCalculator';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

const LineItemsTable: React.FC<LineItemsTableProps> = ({ items, onChange }) => {
  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      srNo: items.length + 1,
      description: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id)
      .map((item, idx) => ({ ...item, srNo: idx + 1 }));
    onChange(updated);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updated = items.map(item => {
      if (item.id !== id) return item;
      const newItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? (value as number) : item.quantity;
        const rate = field === 'rate' ? (value as number) : item.rate;
        newItem.amount = calculateLineItem(qty, rate);
      }
      return newItem;
    });
    onChange(updated);
  };

  const units = ['Nos', 'Pcs', 'Sqft', 'Rft', 'Kg', 'Ltr', 'Mtr', 'Set', 'Pair', 'Box', 'Roll', 'Job', 'Lot'];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Line Items</h3>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide"
          style={{ gridTemplateColumns: '32px 1fr 80px 85px 100px 90px 40px' }}
        >
          <div className="px-2 py-2"></div>
          <div className="px-2 py-2">Description</div>
          <div className="px-2 py-2 text-center">Qty</div>
          <div className="px-2 py-2 text-center">Unit</div>
          <div className="px-2 py-2 text-right">Rate (₹)</div>
          <div className="px-2 py-2 text-right">Amount (₹)</div>
          <div className="px-2 py-2"></div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No items added. Click "Add Item" to begin.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid items-center hover:bg-gray-50"
                style={{ gridTemplateColumns: '32px 1fr 80px 85px 100px 90px 40px' }}
              >
                <div className="px-1 py-1.5 flex items-center justify-center text-gray-400">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div className="px-1.5 py-1.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder={`Item ${idx + 1} description`}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="px-1.5 py-1.5">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="px-1.5 py-1.5">
                  <select
                    value={item.unit}
                    onChange={e => updateItem(item.id, 'unit', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>
                <div className="px-1.5 py-1.5">
                  <input
                    type="number"
                    value={item.rate}
                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="px-1.5 py-1.5 text-right">
                  <span className="text-sm font-medium text-gray-800 block py-1 pr-2">
                    {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="px-1 py-1.5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item row */}
        <div className="border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={addItem}
            className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineItemsTable;
