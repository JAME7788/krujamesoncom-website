import React, { useState, useMemo } from 'react';
import { Search, Download, Trash2, ArrowUpRight, ArrowDownRight, Award, PlusCircle, MinusCircle, Users, Wallet } from 'lucide-react';
import { loadRoster, loadAllRosters } from '../../services/rosterService';
import type { StudentInfo } from '../../data/students2569';

interface Transaction {
  id: string;
  studentCode: string;
  studentName: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  timestamp: number;
}

const STORAGE_KEY = 'krujames_savings_v1';

const loadStoredTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load savings transactions', e);
    return [];
  }
};

const SavingsTracker: React.FC = () => {
  const allRosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(allRosters).sort(), [allRosters]);
  
  const [selectedClass, setSelectedClass] = useState<string>(classrooms[0] || 'ป.1');
  const [transactions, setTransactions] = useState<Transaction[]>(loadStoredTransactions);
  
  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isSearching, setIsSearching] = useState(false);

  // Save transactions when changed
  const saveTransactions = (list: Transaction[]) => {
    setTransactions(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save savings transactions', e);
    }
  };

  // Get current roster based on selected classroom
  const currentRoster = useMemo(() => {
    return loadRoster(selectedClass);
  }, [selectedClass]);

  // Compute student balances
  const studentBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Initialize current roster with 0
    currentRoster.forEach(s => {
      balances[s.studentCode] = 0;
    });

    // Apply transactions for current classroom
    transactions.forEach(t => {
      // Find if student is in current roster
      const exists = currentRoster.some(s => s.studentCode === t.studentCode);
      if (exists) {
        if (t.type === 'deposit') {
          balances[t.studentCode] = (balances[t.studentCode] || 0) + t.amount;
        } else {
          balances[t.studentCode] = (balances[t.studentCode] || 0) - t.amount;
        }
      }
    });

    return balances;
  }, [transactions, currentRoster]);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || selectedStudent) return [];
    const query = searchQuery.toLowerCase();
    return currentRoster.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.studentCode.includes(query) ||
      `เลขที่ ${s.no}`.includes(query)
    );
  }, [searchQuery, currentRoster, selectedStudent]);

  // Classroom stats
  const stats = useMemo<{ total: number; saversCount: number; topSaver: { name: string; amount: number } | null }>(() => {
    let total = 0;
    let saversCount = 0;
    let topSaver: { name: string; amount: number } | null = null;

    Object.entries(studentBalances).forEach(([code, bal]) => {
      if (bal > 0) {
        total += bal;
        saversCount++;
        if (!topSaver || bal > topSaver.amount) {
          const stud = currentRoster.find(s => s.studentCode === code);
          if (stud) {
            topSaver = { name: stud.name, amount: bal };
          }
        }
      }
    });

    return { total, saversCount, topSaver };
  }, [studentBalances, currentRoster]);

  // Transactions filtered by classroom students
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      currentRoster.some(s => s.studentCode === t.studentCode)
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, currentRoster]);

  // Handle transaction recording
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('กรุณาเลือกนักเรียนจากรายชื่อที่ค้นพบ');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }

    if (txType === 'withdraw' && (studentBalances[selectedStudent.studentCode] || 0) < val) {
      alert(`ยอดเงินคงเหลือไม่เพียงพอ (คงเหลือยอดปัจจุบัน: ${studentBalances[selectedStudent.studentCode] || 0} บาท)`);
      return;
    }

    const newTx: Transaction = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentCode: selectedStudent.studentCode,
      studentName: selectedStudent.name,
      amount: val,
      type: txType,
      timestamp: Date.now()
    };

    saveTransactions([newTx, ...transactions]);
    
    // Reset Form
    setSelectedStudent(null);
    setSearchQuery('');
    setAmount('');
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm('คุณต้องการยกเลิกรายการธุรกรรมนี้ใช่หรือไม่? ยอดเงินจะถูกปรับคืนโดยอัตโนมัติ')) {
      saveTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'วันเวลา,รหัสประจำตัว,เลขที่,ชื่อ-สกุล,ประเภท,จำนวนเงิน (บาท)\n';
    
    // Sort transactions chronologically
    const sorted = [...filteredTransactions].reverse();
    sorted.forEach(t => {
      const student = currentRoster.find(s => s.studentCode === t.studentCode);
      const studentNo = student ? student.no : '';
      const dateStr = new Date(t.timestamp).toLocaleString('th-TH');
      csv += `${dateStr},${t.studentCode},${studentNo},${t.studentName},${t.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'},${t.amount}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บันทึกเงินออม_${selectedClass}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Select student from suggestions
  const selectStudent = (student: StudentInfo) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.emoji} เลขที่ ${student.no} - ${student.name}`);
    setIsSearching(false);
  };

  // Leaderboard of top savers
  const leaderboard = useMemo(() => {
    return currentRoster
      .map(s => ({
        ...s,
        balance: studentBalances[s.studentCode] || 0
      }))
      .filter(s => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [currentRoster, studentBalances]);

  return (
    <div className="savings-container">
      {/* Header and Class Selector */}
      <div className="section-header-savings">
        <div className="title-block">
          <Wallet className="header-icon" size={24} />
          <div>
            <h3>กระปุกออมสินอัจฉริยะ</h3>
            <p>บันทึกและสถิติเงินออมสะสมรายบุคคล</p>
          </div>
        </div>
        <div className="class-selector">
          <span className="select-label">เลือกระดับชั้น:</span>
          <select 
            value={selectedClass} 
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedStudent(null);
              setSearchQuery('');
            }}
            className="custom-select"
          >
            {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-blue">
          <div className="stat-icon-wrapper blue">
            <Wallet size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-label">ยอดเงินออมรวมในห้อง</span>
            <span className="stat-value">{stats.total.toLocaleString()} <span className="currency">บาท</span></span>
          </div>
        </div>

        <div className="stat-card glass-emerald">
          <div className="stat-icon-wrapper emerald">
            <Users size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-label">จำนวนนักเรียนที่ออมเงิน</span>
            <span className="stat-value">{stats.saversCount} <span className="currency">คน / {currentRoster.length} คน</span></span>
          </div>
        </div>

        <div className="stat-card glass-yellow">
          <div className="stat-icon-wrapper yellow">
            <Award size={20} />
          </div>
          <div className="stat-data">
            <span className="stat-label">ยอดนักออมสูงสุด</span>
            <span className="stat-value text-truncate" title={stats.topSaver ? stats.topSaver.name : 'ไม่มีข้อมูล'}>
              {stats.topSaver ? `${stats.topSaver.name.split(' ')[0]} (${stats.topSaver.amount} บ.)` : 'ไม่มีข้อมูล'}
            </span>
          </div>
        </div>
      </div>

      <div className="savings-layout">
        {/* Recording Form & History */}
        <div className="main-savings-section">
          {/* Form */}
          <div className="savings-form-card">
            <h4>✏️ บันทึกธุรกรรมเงินออม</h4>
            <form onSubmit={handleAddTransaction} className="form-grid">
              <div className="form-group relative">
                <label>ค้นหานักเรียน (พิมพ์ชื่อ/เลขที่)</label>
                <div className="input-search-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหารายชื่อนักเรียน..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedStudent) {
                        setSelectedStudent(null);
                      }
                      setIsSearching(true);
                    }}
                    onFocus={() => setIsSearching(true)}
                    required
                  />
                  {selectedStudent && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedStudent(null);
                        setSearchQuery('');
                      }} 
                      className="clear-btn"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearching && suggestions.length > 0 && (
                  <div className="autocomplete-dropdown shadow-lg">
                    {suggestions.map(s => (
                      <div 
                        key={s.studentCode} 
                        onClick={() => selectStudent(s)}
                        className="suggestion-item"
                      >
                        <span className="emoji">{s.emoji}</span>
                        <span className="info">เลขที่ {s.no} - {s.name}</span>
                        <span className="badge">บาลานซ์: {studentBalances[s.studentCode] || 0} บ.</span>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && searchQuery.trim() && suggestions.length === 0 && !selectedStudent && (
                  <div className="autocomplete-dropdown no-results">
                    ไม่พบชื่อนักเรียนที่สอดคล้อง
                  </div>
                )}
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ประเภทรายการ</label>
                  <div className="btn-toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${txType === 'deposit' ? 'deposit-active' : ''}`}
                      onClick={() => setTxType('deposit')}
                    >
                      <PlusCircle size={14} /> ฝากเงิน
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${txType === 'withdraw' ? 'withdraw-active' : ''}`}
                      onClick={() => setTxType('withdraw')}
                    >
                      <MinusCircle size={14} /> ถอนเงิน
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-submit-tx">
                บันทึกรายการ {txType === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="history-card">
            <div className="card-header-with-action">
              <h4>🕒 ประวัติการฝาก/ถอน ({filteredTransactions.length} รายการ)</h4>
              {filteredTransactions.length > 0 && (
                <button onClick={handleExportCSV} className="btn-export-csv">
                  <Download size={14} /> ส่งออก CSV
                </button>
              )}
            </div>

            <div className="history-list-wrapper">
              {filteredTransactions.length === 0 ? (
                <div className="empty-history">
                  <p>ยังไม่มีรายการประวัติการออมเงินในห้องเรียนนี้</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table-savings">
                    <thead>
                      <tr>
                        <th>วันเวลา</th>
                        <th>นักเรียน</th>
                        <th>ประเภท</th>
                        <th>จำนวนเงิน</th>
                        <th>ยกเลิก</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => {
                        const student = currentRoster.find(s => s.studentCode === t.studentCode);
                        return (
                          <tr key={t.id}>
                            <td className="time-col">{new Date(t.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ({new Date(t.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})</td>
                            <td className="student-col">
                              <span className="student-emoji">{student?.emoji || '👦'}</span>
                              <span className="student-no">เลขที่ {student?.no || '-'}</span>
                              <span className="student-name">{t.studentName}</span>
                            </td>
                            <td>
                              <span className={`badge-type ${t.type}`}>
                                {t.type === 'deposit' ? (
                                  <><ArrowUpRight size={12} /> ฝาก</>
                                ) : (
                                  <><ArrowDownRight size={12} /> ถอน</>
                                )}
                              </span>
                            </td>
                            <td className={`amount-col ${t.type}`}>
                              {t.type === 'deposit' ? '+' : '-'}{t.amount} บ.
                            </td>
                            <td>
                              <button onClick={() => handleDeleteTransaction(t.id)} className="btn-delete-tx" title="ลบธุรกรรม">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Leaderboard */}
        <div className="savings-sidebar">
          <div className="leaderboard-card">
            <h4>🏆 อันดับการออมเงิน ({selectedClass})</h4>
            <div className="leaderboard-list">
              {leaderboard.length === 0 ? (
                <div className="empty-leaderboard">
                  <p>ยังไม่มีการฝากเงินออมในระบบ</p>
                </div>
              ) : (
                leaderboard.map((s, idx) => (
                  <div key={s.studentCode} className="leaderboard-item">
                    <div className="rank-left">
                      <span className={`rank-number rank-${idx + 1}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <span className="student-emoji">{s.emoji}</span>
                      <div className="student-details">
                        <span className="student-name text-truncate">{s.name}</span>
                        <span className="student-no">เลขที่ {s.no}</span>
                      </div>
                    </div>
                    <span className="rank-amount font-semibold">{s.balance.toLocaleString()} บ.</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .savings-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Prompt', sans-serif;
        }
        .section-header-savings {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .title-block {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-icon {
          color: #6366f1;
        }
        .title-block h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 600;
          color: #1e293b;
        }
        .title-block p {
          margin: 2px 0 0;
          font-size: 0.8rem;
          color: #64748b;
        }
        .class-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .select-label {
          font-size: 0.85rem;
          color: #475569;
          font-weight: 500;
        }
        .custom-select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.88rem;
          font-weight: 500;
          background: white;
          color: #1e293b;
          outline: none;
          cursor: pointer;
        }
        .custom-select:focus {
          border-color: #6366f1;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .glass-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #1e40af; border-color: #bfdbfe; }
        .glass-emerald { background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #065f46; border-color: #a7f3d0; }
        .glass-yellow { background: linear-gradient(135deg, #fefce8, #fef9c3); color: #854d0e; border-color: #fef08a; }
        .stat-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
        }
        .stat-icon-wrapper.blue { background: #dbeafe; color: #2563eb; }
        .stat-icon-wrapper.emerald { background: #d1fae5; color: #10b981; }
        .stat-icon-wrapper.yellow { background: #fef9c3; color: #eab308; }
        .stat-data {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .stat-label {
          font-size: 0.78rem;
          opacity: 0.8;
          font-weight: 500;
        }
        .stat-value {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 2px;
        }
        .currency {
          font-size: 0.8rem;
          font-weight: 500;
        }
        .savings-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .savings-layout {
            grid-template-columns: 1fr;
          }
        }
        .main-savings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .savings-form-card, .history-card, .leaderboard-card {
          background: white;
          border-radius: 1.25rem;
          padding: 1.5rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .savings-form-card h4, .history-card h4, .leaderboard-card h4 {
          margin: 0 0 1.25rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
        }
        .input-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }
        .input-search-wrapper input, .form-group input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input[type="number"] {
          padding-left: 12px;
        }
        .input-search-wrapper input:focus, .form-group input:focus {
          border-color: #6366f1;
        }
        .clear-btn {
          position: absolute;
          right: 12px;
          background: #e2e8f0;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          color: #64748b;
        }
        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .form-row-2col {
            grid-template-columns: 1fr;
          }
        }
        .btn-toggle-group {
          display: flex;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 3px;
          border: 1px solid #e2e8f0;
        }
        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn.deposit-active {
          background: white;
          color: #059669;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .toggle-btn.withdraw-active {
          background: white;
          color: #dc2626;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-submit-tx {
          background: #6366f1;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
          transition: background 0.2s;
        }
        .btn-submit-tx:hover {
          background: #4f46e5;
        }
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 10;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-top: 4px;
          max-height: 180px;
          overflow-y: auto;
        }
        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          font-size: 0.88rem;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
        }
        .suggestion-item:hover {
          background: #f8fafc;
        }
        .suggestion-item .emoji {
          font-size: 1.1rem;
        }
        .suggestion-item .info {
          flex: 1;
          color: #1e293b;
          font-weight: 500;
        }
        .suggestion-item .badge {
          font-size: 0.72rem;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .no-results {
          padding: 12px;
          font-size: 0.85rem;
          color: #64748b;
          text-align: center;
        }
        .card-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .card-header-with-action h4 {
          margin: 0;
        }
        .btn-export-csv {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-export-csv:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .empty-history {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.88rem;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .custom-table-savings {
          width: 100%;
          border-collapse: collapse;
        }
        .custom-table-savings th, .custom-table-savings td {
          padding: 10px 12px;
          text-align: left;
          font-size: 0.85rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-table-savings th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
        }
        .time-col {
          color: #64748b;
          font-size: 0.8rem;
        }
        .student-col {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .student-emoji {
          font-size: 1.1rem;
        }
        .student-no {
          font-size: 0.72rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 500;
        }
        .student-name {
          color: #1e293b;
          font-weight: 500;
        }
        .badge-type {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          }
        .badge-type.deposit { background: #ecfdf5; color: #047857; }
        .badge-type.withdraw { background: #fef2f2; color: #b91c1c; }
        .amount-col {
          font-weight: 600;
        }
        .amount-col.deposit { color: #10b981; }
        .amount-col.withdraw { color: #ef4444; }
        .btn-delete-tx {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-delete-tx:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .leaderboard-card {
          height: 100%;
        }
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 450px;
          overflow-y: auto;
        }
        .empty-leaderboard {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.88rem;
        }
        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }
        .rank-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .rank-number {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          width: 20px;
          text-align: center;
        }
        .rank-1 { color: #eab308; font-size: 1.1rem; }
        .rank-2 { color: #94a3b8; font-size: 1.1rem; }
        .rank-3 { color: #b45309; font-size: 1.1rem; }
        .student-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .student-details .student-name {
          font-size: 0.85rem;
        }
        .student-details .student-no {
          width: max-content;
          margin-top: 1px;
        }
        .rank-amount {
          font-size: 0.88rem;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default SavingsTracker;
