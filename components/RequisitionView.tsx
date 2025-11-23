import React, { useState, useEffect } from 'react';
import { RequisitionItem, Requester } from '../types';
import { db, snapshotToArray } from '../services/firebase';
import { onValue, ref } from 'firebase/database';
import { ArrowLeft, Printer } from 'lucide-react';

interface RequisitionViewProps {
  items: RequisitionItem[];
  onBack: () => void;
  onPrint: (items: RequisitionItem[], requester: string, docId: string) => void;
}

const RequisitionView: React.FC<RequisitionViewProps> = ({ items, onBack, onPrint }) => {
  const [localItems, setLocalItems] = useState<RequisitionItem[]>(items);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedRequester, setSelectedRequester] = useState('');
  const [docId, setDocId] = useState(`REQ-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000)}`);
  
  useEffect(() => {
    const unsub = onValue(ref(db, 'config/requesters'), (snapshot) => {
        setRequesters(snapshotToArray<Requester>(snapshot));
    });
    return () => unsub();
  }, []);

  const handleQuantityChange = (code: string, lot: string, val: number) => {
    setLocalItems(prev => prev.map(item => {
        if (item.code === code && item.lotNo === lot) {
            return { ...item, manualOrder: val, isSelected: val > 0 };
        }
        return item;
    }));
  };

  const applySuggestion = (type: '1.2' | '1.5') => {
    setLocalItems(prev => prev.map(item => ({
        ...item,
        manualOrder: type === '1.2' ? item.suggested1_2 : item.suggested1_5,
        isSelected: (type === '1.2' ? item.suggested1_2 : item.suggested1_5) > 0
    })));
  };

  const toggleSelect = (code: string, lot: string) => {
    setLocalItems(prev => prev.map(item => {
        if (item.code === code && item.lotNo === lot) {
            return { ...item, isSelected: !item.isSelected };
        }
        return item;
    }));
  };

  // Calculations
  const selectedItems = localItems.filter(i => i.isSelected);
  const totalValue = selectedItems.reduce((acc, item) => acc + (item.manualOrder * item.price), 0);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-6 transition-colors">
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft /> กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ระบบคำนวณเบิกยา (Forecasting)</h1>
        <div>
            {/* Space for actions */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
         <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded border border-blue-200 dark:border-gray-700">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white">ข้อมูลการเบิก</label>
            <div className="mb-2 text-gray-900 dark:text-gray-300">
                <span className="text-sm text-gray-500 dark:text-gray-400">เลขที่ใบเบิก:</span> 
                <span className="font-mono ml-2">{docId}</span>
            </div>
            <div className="mb-2 text-gray-900 dark:text-gray-300">
                <span className="text-sm text-gray-500 dark:text-gray-400">วันที่:</span> 
                <span className="ml-2">{new Date().toLocaleDateString('th-TH')}</span>
            </div>
            <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">ผู้เบิก:</label>
                <select 
                    className="w-full mt-1 border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedRequester}
                    onChange={(e) => setSelectedRequester(e.target.value)}
                >
                    <option value="">-- เลือกผู้เบิก --</option>
                    {requesters.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
            </div>
         </div>

         <div className="bg-purple-50 dark:bg-gray-800 p-4 rounded border border-purple-200 dark:border-gray-700 flex flex-col justify-center items-center">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">มูลค่าการเบิก (Estimated)</h3>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mt-2">✨ {totalValue.toLocaleString()} ฿</div>
         </div>

         <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white">ตัวช่วยคำนวณ (Auto Fill)</label>
            <div className="flex gap-2">
                <button 
                    onClick={() => applySuggestion('1.2')}
                    className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 py-2 rounded text-sm text-center text-gray-900 dark:text-white"
                >
                    🤖 Auto 1.2x
                </button>
                <button 
                    onClick={() => applySuggestion('1.5')}
                    className="flex-1 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 py-2 rounded text-sm text-center text-gray-900 dark:text-yellow-100"
                >
                    🌟 Auto 1.5x
                </button>
            </div>
         </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-800 text-white">
                <tr>
                    <th className="p-3 w-10">
                        <input type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            setLocalItems(prev => prev.map(i => ({ ...i, isSelected: checked })));
                        }} />
                    </th>
                    <th className="p-3 text-left">รายการยา</th>
                    <th className="p-3 text-center">คงเหลือ</th>
                    <th className="p-3 text-center">⚡ อัตราใช้/วีค</th>
                    <th className="p-3 text-center bg-gray-700">🤖 แนะนำ 1.2x</th>
                    <th className="p-3 text-center bg-gray-700">🌟 แนะนำ 1.5x</th>
                    <th className="p-3 text-center w-32 bg-blue-900">✏️ จำนวนเบิก</th>
                    <th className="p-3 text-right">มูลค่า</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {localItems.map((item, idx) => (
                    <tr key={`${item.code}-${idx}`} className={item.isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                        <td className="p-3 text-center">
                            <input 
                                type="checkbox" 
                                checked={item.isSelected}
                                onChange={() => toggleSelect(item.code, item.lotNo)}
                            />
                        </td>
                        <td className="p-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.code} | Pack: {item.pack} | Price: {item.price}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-900 dark:text-gray-100">{item.balance}</td>
                        <td className="p-3 text-center text-gray-900 dark:text-gray-100">{item.usageRatePerWeek}</td>
                        <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.suggested1_2}</td>
                        <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.suggested1_5}</td>
                        <td className="p-3 text-center">
                            <input 
                                type="number" 
                                className="w-20 border-2 border-blue-300 dark:border-blue-700 rounded p-1 text-center font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-gray-700"
                                value={item.manualOrder}
                                onChange={(e) => handleQuantityChange(item.code, item.lotNo, parseInt(e.target.value) || 0)}
                            />
                        </td>
                        <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                            {(item.manualOrder * item.price).toLocaleString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg flex justify-end gap-4 no-print z-50">
            <div className="text-right mr-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">เลือก {selectedItems.length} รายการ</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalValue.toLocaleString()} บาท</div>
            </div>
            <button 
                disabled={selectedItems.length === 0 || !selectedRequester}
                onClick={() => onPrint(selectedItems, selectedRequester, docId)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700 shadow-lg"
            >
                <Printer /> สร้างใบเบิก (Print)
            </button>
      </div>
    </div>
  );
};

export default RequisitionView;