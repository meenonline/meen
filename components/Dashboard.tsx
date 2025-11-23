import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { InventoryItem } from '../types';

interface DashboardProps {
  inventory: InventoryItem[];
  darkMode?: boolean;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Amber, Red

const Dashboard: React.FC<DashboardProps> = ({ inventory, darkMode }) => {
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  // Stats
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((acc, item) => acc + (item.balance * item.price), 0);
  const lowStockItems = inventory.filter(i => i.status === 'LOW').length;
  const expiredItems = inventory.filter(i => i.expStatus === 'EXPIRED').length;

  // Chart Data: Stock Status
  const statusData = useMemo(() => {
    const normal = inventory.filter(i => i.status === 'NORMAL').length;
    const low = inventory.filter(i => i.status === 'LOW').length;
    const empty = inventory.filter(i => i.status === 'EMPTY').length;
    return [
      { name: 'ปกติ', value: normal },
      { name: 'ใกล้หมด', value: low },
      { name: 'หมด', value: empty },
    ];
  }, [inventory]);

  // Chart Data: Value by Cabinet
  const cabinetData = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach(item => {
      const cab = item.cabinet || 'Unassigned';
      const val = item.balance * item.price;
      map.set(cab, (map.get(cab) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // Styles based on theme
  const cardClass = "bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors";
  const axisColor = darkMode ? "#9CA3AF" : "#4B5563";
  const gridColor = darkMode ? "#374151" : "#E5E7EB";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${cardClass} border-l-4 border-blue-500`}>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">รายการยาทั้งหมด</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems} รายการ</p>
        </div>
        <div className={`${cardClass} border-l-4 border-emerald-500`}>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">มูลค่ารวมในคลัง</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalValue.toLocaleString()} บาท</p>
        </div>
        <div className={`${cardClass} border-l-4 border-yellow-500`}>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">ยาใกล้หมด (Min Stock)</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockItems} รายการ</p>
        </div>
        <div className={`${cardClass} border-l-4 border-red-500`}>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">ยาหมดอายุ/ใกล้หมดอายุ</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{expiredItems} รายการ</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex-1 transition-colors">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">สัดส่วนสถานะสต็อก</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={darkMode ? '#1f2937' : '#fff'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc', color: darkMode ? '#fff' : '#000' }} 
                />
                <Legend wrapperStyle={{ color: darkMode ? '#9CA3AF' : '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cabinet Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex-1 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">มูลค่าตามตู้ยา</h3>
            <select 
              value={yearFilter} 
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="border rounded p-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {[0,1,2].map(i => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y + 543}</option>;
              })}
            </select>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={cabinetData}>
                 <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                 <XAxis dataKey="name" tick={{ fill: axisColor }} stroke={axisColor} />
                 <YAxis tick={{ fill: axisColor }} stroke={axisColor} />
                 <Tooltip 
                   formatter={(val: number) => val.toLocaleString() + ' บาท'} 
                   contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc', color: darkMode ? '#fff' : '#000' }}
                 />
                 <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;