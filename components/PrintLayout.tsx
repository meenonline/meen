import React, { useRef } from 'react';
import { RequisitionItem } from '../types';
import ReactToPrint from 'react-to-print';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintLayoutProps {
  items: RequisitionItem[];
  requester: string;
  docId: string;
  onBack: () => void;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ items, requester, docId, onBack }) => {
  const componentRef = useRef(null);

  // Group by Cabinet for the "Split Cabinet" view if needed, 
  // but for now we list all as standard IPD requisition.
  
  return (
    <div className="min-h-screen bg-gray-500 p-8 flex flex-col items-center">
      <div className="w-full max-w-[210mm] flex justify-between mb-4 no-print">
        <button onClick={onBack} className="bg-white px-4 py-2 rounded shadow flex items-center gap-2">
            <ArrowLeft /> กลับ
        </button>
        <ReactToPrint
          trigger={() => <button className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"><Printer /> สั่งพิมพ์</button>}
          content={() => componentRef.current}
        />
      </div>

      <div ref={componentRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl print:shadow-none text-black">
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">ใบเบิกเวชภัณฑ์ยา (Warehouse Requisition)</h1>
            <h2 className="text-lg">โรงพยาบาล.......................</h2>
        </div>

        <div className="flex justify-between mb-6 border-b pb-4">
            <div>
                <p><strong>เลขที่ใบเบิก:</strong> {docId}</p>
                <p><strong>วันที่เบิก:</strong> {new Date().toLocaleDateString('th-TH')}</p>
                <p><strong>แผนก:</strong> Substock IPD</p>
            </div>
            <div className="text-right">
                <p><strong>ผู้เบิก:</strong> {requester}</p>
                <p><strong>ประเภท:</strong> เบิกเติมคลังย่อย</p>
            </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 w-10 text-center">#</th>
                    <th className="border border-gray-300 p-2 text-left">รายการยา</th>
                    <th className="border border-gray-300 p-2 w-20 text-center">หน่วย</th>
                    <th className="border border-gray-300 p-2 w-24 text-center">คงเหลือ</th>
                    <th className="border border-gray-300 p-2 w-24 text-center">จำนวนเบิก</th>
                    <th className="border border-gray-300 p-2 w-32 text-right">ราคา/หน่วย</th>
                    <th className="border border-gray-300 p-2 w-32 text-right">รวมเงิน</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, idx) => (
                    <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-2">
                            {item.name} <br/>
                            <span className="text-xs text-gray-500">Code: {item.code} ({item.cabinet})</span>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">{item.pack}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.balance}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold">{item.manualOrder}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.price.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">{(item.manualOrder * item.price).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr className="bg-gray-50 font-bold">
                    <td colSpan={6} className="border border-gray-300 p-2 text-right">รวมเป็นเงินทั้งสิ้น</td>
                    <td className="border border-gray-300 p-2 text-right">
                        {items.reduce((sum, i) => sum + (i.manualOrder * i.price), 0).toLocaleString()} บาท
                    </td>
                </tr>
            </tfoot>
        </table>

        {/* Footer Signatures */}
        <div className="mt-12 flex justify-between text-center">
            <div className="w-1/3">
                <div className="border-b border-black mb-2 w-full h-8"></div>
                <p>({requester})</p>
                <p>ผู้เบิก</p>
            </div>
            <div className="w-1/3">
                <div className="border-b border-black mb-2 w-full h-8"></div>
                <p>(...........................................)</p>
                <p>หัวหน้าแผนก/พยาน</p>
            </div>
             <div className="w-1/3">
                <div className="border-b border-black mb-2 w-full h-8"></div>
                <p>(...........................................)</p>
                <p>เจ้าหน้าที่คลังยา</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;