import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { ref, update, push, remove, onValue } from 'firebase/database';
import { InventoryItem, Requester } from '../types';
import { snapshotToArray } from '../services/firebase';
import { Save, Plus, Trash } from 'lucide-react';
import { CABINET_OPTIONS } from '../constants';

interface SettingsProps {
  inventory: InventoryItem[];
}

const Settings: React.FC<SettingsProps> = ({ inventory }) => {
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [minStock, setMinStock] = useState<number>(0);
  const [cabinet, setCabinet] = useState<string>('A');
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [newRequesterName, setNewRequesterName] = useState('');

  useEffect(() => {
    // Load requesters
    const unsub = onValue(ref(db, 'config/requesters'), (snapshot) => {
      setRequesters(snapshotToArray<Requester>(snapshot));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // When drug selection changes, load existing config
    if (selectedDrug) {
        const item = inventory.find(i => i.code === selectedDrug);
        if (item) {
            setMinStock(item.minStock || 0);
            setCabinet(item.cabinet || 'A');
        }
    }
  }, [selectedDrug, inventory]);

  const handleSaveConfig = async () => {
    if (!selectedDrug) return;
    const updates: any = {};
    updates[`config/minStock/${selectedDrug}`] = minStock;
    updates[`config/cabinets/${selectedDrug}`] = cabinet;
    
    try {
        await update(ref(db), updates);
        alert('บันทึกการตั้งค่าเรียบร้อย');
    } catch (e) {
        console.error(e);
        alert('เกิดข้อผิดพลาด');
    }
  };

  const handleAddRequester = async () => {
    if(!newRequesterName.trim()) return;
    await push(ref(db, 'config/requesters'), { name: newRequesterName });
    setNewRequesterName('');
  };

  const handleRemoveRequester = async (id: string) => {
    if(confirm('ลบรายชื่อผู้เบิกนี้?')) {
        await remove(ref(db, `config/requesters/${id}`));
    }
  };

  const uniqueDrugs = Array.from(new Set(inventory.map(i => i.code))).map(code => {
      const item = inventory.find(i => i.code === code);
      return { code, name: item?.name || '' };
  }).sort((a,b) => a.name.localeCompare(b.name));

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
        <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-700 pb-2 text-gray-900 dark:text-white">ตั้งค่ารายการยา (Config)</h2>
        <div className="space-y-4">
            <div>
                <label className={labelClass}>เลือกรายการยา</label>
                <select 
                    value={selectedDrug}
                    onChange={(e) => setSelectedDrug(e.target.value)}
                    className={inputClass}
                >
                    <option value="">-- เลือกยา --</option>
                    {uniqueDrugs.map(d => (
                        <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                    ))}
                </select>
            </div>
            
            {selectedDrug && (
                <>
                    <div>
                        <label className={labelClass}>Min Stock (Minimum)</label>
                        <input 
                            type="number" 
                            value={minStock}
                            onChange={(e) => setMinStock(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    
                    <div>
                        <label className={labelClass}>ตู้ยา (Cabinet)</label>
                        <select 
                            value={cabinet}
                            onChange={(e) => setCabinet(e.target.value)}
                            className={inputClass}
                        >
                            {CABINET_OPTIONS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleSaveConfig}
                        className="w-full bg-blue-600 text-white p-2 rounded flex justify-center items-center gap-2 hover:bg-blue-700 mt-4"
                    >
                        <Save size={18} /> บันทึกค่า
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
        <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-700 pb-2 text-gray-900 dark:text-white">จัดการรายชื่อผู้เบิก</h2>
        <div className="flex gap-2 mb-4">
            <input 
                type="text" 
                value={newRequesterName}
                onChange={(e) => setNewRequesterName(e.target.value)}
                placeholder="ชื่อ-สกุล"
                className="flex-1 border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button 
                onClick={handleAddRequester}
                className="bg-green-600 text-white px-4 rounded hover:bg-green-700"
            >
                <Plus size={20} />
            </button>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {requesters.map(r => (
                <li key={r.id} className="py-2 flex justify-between items-center text-gray-900 dark:text-gray-100">
                    <span>{r.name}</span>
                    <button onClick={() => handleRemoveRequester(r.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                        <Trash size={16} />
                    </button>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Settings;