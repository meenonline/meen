import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, signIn, signOut, db, snapshotToArray } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { ADMIN_EMAILS } from './constants';
import { Transaction, DrugConfig, InventoryItem, RequisitionItem } from './types';
import { LayoutDashboard, Package, FileText, Settings as SettingsIcon, LogOut, LogIn, Moon, Sun } from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import RequisitionView from './components/RequisitionView';
import PrintLayout from './components/PrintLayout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<{ minStock: Record<string, number>, cabinets: Record<string, string> }>({ minStock: {}, cabinets: {} });
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('substock-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Forecasting State
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);
  const [showRequisition, setShowRequisition] = useState(false);
  
  // Printing State
  const [printData, setPrintData] = useState<{ items: RequisitionItem[], requester: string, docId: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('substock-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('substock-theme', 'light');
    }
  }, [darkMode]);

  // Fetch Data Realtime
  useEffect(() => {
    if (!user) return;

    const txRef = ref(db, 'transactions');
    const configRef = ref(db, 'config');

    const unsubTx = onValue(txRef, (snapshot) => {
      setTransactions(snapshotToArray<Transaction>(snapshot));
    });

    const unsubConfig = onValue(configRef, (snapshot) => {
      const val = snapshot.val() || {};
      setConfig({
        minStock: val.minStock || {},
        cabinets: val.cabinets || {}
      });
    });

    return () => {
      unsubTx();
      unsubConfig();
    };
  }, [user]);

  // Compute Inventory State
  const inventory: InventoryItem[] = useMemo(() => {
    const map = new Map<string, InventoryItem>();

    transactions.forEach(tx => {
      const key = `${tx.code1}-${tx.LotNo}`; 
      
      if (!map.has(key)) {
        map.set(key, {
          code: tx.code1,
          name: tx.NAME,
          pack: tx.pack,
          totalIn: 0,
          totalOut: 0,
          balance: 0,
          lotNo: tx.LotNo,
          expDate: tx.ExpDate,
          minStock: config.minStock[tx.code1] || 0,
          cabinet: config.cabinets[tx.code1] || 'Unassigned',
          price: tx.price,
          status: 'NORMAL',
          expStatus: 'OK',
          daysToExpire: 0,
          lastUpdate: ''
        });
      }
      
      const item = map.get(key)!;
      if (tx.amount > 0) item.totalIn += tx.amount;
      else item.totalOut += tx.amount;
      item.balance += tx.amount;
      if(tx.date > item.lastUpdate) item.lastUpdate = tx.date;
    });

    return Array.from(map.values()).map(item => {
      if (item.balance <= 0) item.status = 'EMPTY';
      else if (item.balance <= item.minStock) item.status = 'LOW';
      else item.status = 'NORMAL';

      const exp = new Date(item.expDate);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      item.daysToExpire = diffDays;
      
      if (diffDays < 0) item.expStatus = 'EXPIRED';
      else if (diffDays < 90) item.expStatus = 'NEAR'; 
      else item.expStatus = 'OK';

      return item;
    });
  }, [transactions, config]);

  const isAdmin = useMemo(() => {
    return user && user.email && ADMIN_EMAILS.includes(user.email);
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <h1 className="text-3xl font-bold mb-8 text-blue-800 dark:text-blue-400">SubStock RH Manager</h1>
        <button 
          onClick={signIn}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          <span className="font-medium text-gray-700 dark:text-gray-200">เข้าสู่ระบบด้วย Google</span>
        </button>
      </div>
    );
  }

  // Handle Print Mode
  if (printData) {
      return <PrintLayout 
        items={printData.items} 
        requester={printData.requester} 
        docId={printData.docId} 
        onBack={() => setPrintData(null)} 
      />;
  }

  // Handle Requisition Mode (Before Print)
  if (showRequisition) {
      return <RequisitionView 
        items={requisitionItems} 
        onBack={() => setShowRequisition(false)}
        onPrint={(items, requester, docId) => {
            setPrintData({ items, requester, docId });
            setShowRequisition(false);
        }}
      />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-200">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 dark:bg-gray-950 text-white flex-shrink-0 hidden md:flex flex-col border-r border-slate-700 dark:border-gray-800">
          <div className="p-6 border-b border-slate-700 dark:border-gray-800">
            <h1 className="text-xl font-bold">SubStock RH</h1>
            <p className="text-xs text-slate-400 mt-1">{user.displayName}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" icon={<LayoutDashboard />} label="Dashboard" />
            <NavLink to="/inventory" icon={<Package />} label="คลังยา (Inventory)" />
            <NavLink to="/transactions" icon={<FileText />} label="รับเข้า-จ่ายออก" />
            {isAdmin && <NavLink to="/settings" icon={<SettingsIcon />} label="ตั้งค่า (Admin)" />}
          </nav>
          <div className="p-4 border-t border-slate-700 dark:border-gray-800 space-y-2">
            <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 dark:hover:bg-gray-800 transition"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
            </button>
            <button 
              onClick={signOut} 
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 dark:hover:bg-gray-800 transition"
            >
              <LogOut size={20} /> ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 text-gray-900 dark:text-gray-100">
          <Routes>
            <Route path="/" element={<Dashboard inventory={inventory} darkMode={darkMode} />} />
            <Route path="/inventory" element={
                <Inventory 
                    inventory={inventory} 
                    onRequisition={(items) => {
                        setRequisitionItems(items);
                        setShowRequisition(true);
                    }} 
                />
            } />
            <Route path="/transactions" element={<Transactions transactions={transactions} isAdmin={!!isAdmin} />} />
            <Route path="/settings" element={isAdmin ? <Settings inventory={inventory} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link 
            to={to} 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 dark:hover:bg-gray-800'}`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
};

export default App;