import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { ref, push, remove } from 'firebase/database';
import { db } from '../services/firebase';
import { Trash2, Upload, FileSpreadsheet, PlusCircle, MinusCircle } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  isAdmin: boolean;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, isAdmin }) => {
  const [uploadMode, setUploadMode] = useState<'IN' | 'OUT'>('IN');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to parse CSV (Since we can't easily use xlsx in this environment without heavy setups)
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const result = [];
    
    // Simple CSV parser - assumes standard CSV format
    for(let i = 1; i < lines.length; i++) {
        if(!lines[i].trim()) continue;
        const currentLine = lines[i].split(','); 
        const obj: any = {};
        
        if(currentLine.length >= 5) {
            obj.dispno = currentLine[0]?.trim() || '-';
            obj.date = currentLine[1]?.trim() || new Date().toISOString().split('T')[0];
            obj.department = currentLine[2]?.trim() || '-';
            obj.code1 = currentLine[3]?.trim() || '';
            obj.NAME = currentLine[4]?.trim() || 'Unknown';
            obj.amount = parseFloat(currentLine[5]?.trim()) || 0;
            obj.pack = currentLine[6]?.trim() || '1';
            obj.price = parseFloat(currentLine[7]?.trim()) || 0;
            obj.LotNo = currentLine[8]?.trim() || '-';
            obj.Barcode = currentLine[9]?.trim() || '-';
            obj.ExpDate = currentLine[10]?.trim() || '-';
            result.push(obj);
        }
    }
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsProcessing(true);

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedData = parseCSV(text);

        for (const item of parsedData) {
          // Adjust amount based on mode
          const finalAmount = uploadMode === 'IN' ? Math.abs(item.amount) : -Math.abs(item.amount);
          
          const newTx: Omit<Transaction, 'id'> = {
            ...item,
            amount: finalAmount,
            type: uploadMode,
            timestamp: Date.now()
          };
          
          await push(ref(db, 'transactions'), newTx);
        }
        alert(`นำเข้าข้อมูลสำเร็จ ${parsedData.length} รายการ`);
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file); // Reading as text for CSV
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      await remove(ref(db, `transactions/${id}`));
    }
  };

  // Sort by date desc
  const sortedTx = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <FileSpreadsheet className="text-green-600" />
          จัดการรับเข้า-จ่ายออก
        </h2>
        
        {isAdmin && (
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border dark:border-gray-600">
            <div className="flex gap-2">
              <button 
                onClick={() => setUploadMode('IN')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${uploadMode === 'IN' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
              >
                <PlusCircle size={18} /> รับเข้า (In)
              </button>
              <button 
                onClick={() => setUploadMode('OUT')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${uploadMode === 'OUT' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
              >
                <MinusCircle size={18} /> จ่ายออก (Out)
              </button>
            </div>
            
            <div className="border-l dark:border-gray-500 pl-4">
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload size={18} />
                {isProcessing ? 'กำลังประมวลผล...' : 'อัปโหลด CSV'}
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">วันที่</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">เอกสาร</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">รหัสยา</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">ชื่อรายการ</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">จำนวน</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Lot/Exp</th>
              {isAdmin && <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">จัดการ</th>}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTx.slice(0, 50).map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">{tx.date}</td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{tx.dispno}</td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{tx.code1}</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{tx.NAME}</td>
                <td className={`px-4 py-2 text-right font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  <div className="text-xs">L: {tx.LotNo}</div>
                  <div className="text-xs">E: {tx.ExpDate}</div>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-gray-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-xs">
            แสดง 50 รายการล่าสุดจากทั้งหมด {transactions.length} รายการ
        </div>
      </div>
    </div>
  );
};

export default Transactions;