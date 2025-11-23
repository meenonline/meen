import React, { useState } from 'react';
import { InventoryItem, RequisitionItem } from '../types';
import { ShoppingCart, Search } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  onRequisition: (items: RequisitionItem[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onRequisition }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCabinet, setFilterCabinet] = useState('ALL');

  // Filter logic
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCabinet = filterCabinet === 'ALL' || item.cabinet === filterCabinet;
    return matchesSearch && matchesCabinet;
  });

  const handleCreateRequisition = () => {
    // Generate requisition data
    const reqItems: RequisitionItem[] = inventory.map(item => {
        const weeklyRate = Math.abs(item.totalOut) / 4; // Mock calculation
        const suggested1_2 = Math.ceil((weeklyRate * 1.2));
        const suggested1_5 = Math.ceil((weeklyRate * 1.5));
        
        // Suggest ordering only if balance < minStock or logic dictates
        const needsOrder = item.balance <= item.minStock;
        
        return {
            ...item,
            usageRatePerWeek: parseFloat(weeklyRate.toFixed(2)),
            suggested1_2: needsOrder ? Math.max(0, suggested1_2 - item.balance) : 0,
            suggested1_5: needsOrder ? Math.max(0, suggested1_5 - item.balance) : 0,
            manualOrder: 0,
            isSelected: needsOrder
        };
    });

    onRequisition(reqItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors">
        <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="ค้นหาชื่อยา, รหัสยา..."
                    className="pl-10 p-2 border rounded w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={filterCabinet}
                onChange={(e) => setFilterCabinet(e.target.value)}
            >
                <option value="ALL">ทุกตู้</option>
                <option value="A">ตู้ A</option>
                <option value="B">ตู้ B</option>
                <option value="C">ตู้ C</option>
                <option value="D">ตู้ D</option>
                <option value="E">ตู้ E</option>
                <option value="ตู้เย็น">ตู้เย็น</option>
                <option value="ยาเสพติด">ยาเสพติด</option>
            </select>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleCreateRequisition}
                className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700"
            >
                <ShoppingCart size={18} /> คำนวณเบิก (Forecasting)
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">รหัส</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">ชื่อยา</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">ตู้</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">Min</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">Lot/Exp</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">คงเหลือ</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">สถานะ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredItems.map(item => (
                        <tr key={`${item.code}-${item.lotNo}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.code}</td>
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                            <td className="px-4 py-2 text-center">
                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded text-xs font-bold">{item.cabinet || '-'}</span>
                            </td>
                            <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">{item.minStock}</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                <div>{item.lotNo}</div>
                                <div className={`${item.expStatus !== 'OK' ? 'text-red-500 font-bold' : ''}`}>{item.expDate}</div>
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-lg text-gray-900 dark:text-gray-100">{item.balance}</td>
                            <td className="px-4 py-2 text-center">
                                {item.status === 'EMPTY' && <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-full text-xs">หมด</span>}
                                {item.status === 'LOW' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-full text-xs">ต่ำกว่าเกณฑ์</span>}
                                {item.status === 'NORMAL' && <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full text-xs">ปกติ</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;