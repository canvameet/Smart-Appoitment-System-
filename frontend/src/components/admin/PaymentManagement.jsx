import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaRupeeSign, FaCheckCircle, FaClock, FaTimesCircle, FaUndo, FaSearch } from 'react-icons/fa';
import LoadingLogo from '../LoadingLogo';

const API = 'http://localhost:5000';

const PaymentManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/payment/transactions?count=50`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId, amount) => {
    if (!window.confirm(`Are you sure you want to refund ₹${amount}?`)) {
      return;
    }

    try {
      const response = await axios.post(`${API}/payment/refund`, {
        payment_id: paymentId
      });

      if (response.data.success) {
        toast.success('Refund initiated successfully');
        fetchTransactions();
      } else {
        toast.error(response.data.error || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'captured': { color: 'bg-green-100 text-green-800 border-green-300', icon: <FaCheckCircle /> },
      'authorized': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <FaClock /> },
      'failed': { color: 'bg-red-100 text-red-800 border-red-300', icon: <FaTimesCircle /> },
      'refunded': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <FaUndo /> }
    };

    const statusInfo = statusMap[status] || statusMap['authorized'];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
        {statusInfo.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.contact?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || txn.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'captured')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingLogo size="lg" />
        <p className="mt-4 text-gray-600 font-semibold">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 font-semibold text-sm uppercase">Total Revenue</span>
            <FaRupeeSign className="text-green-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-green-700">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-1">Captured Payments</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-600 font-semibold text-sm uppercase">Total Transactions</span>
            <FaCheckCircle className="text-blue-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-blue-700">{transactions.length}</p>
          <p className="text-sm text-blue-600 mt-1">All Time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-600 font-semibold text-sm uppercase">Successful</span>
            <FaCheckCircle className="text-purple-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-purple-700">
            {transactions.filter(t => t.status === 'captured').length}
          </p>
          <p className="text-sm text-purple-600 mt-1">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-semibold text-sm uppercase">Refunded</span>
            <FaUndo className="text-gray-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-gray-700">₹{totalRefunded.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-1">Total Refunds</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
          >
            <option value="all">All Status</option>
            <option value="captured">Captured</option>
            <option value="authorized">Authorized</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            onClick={fetchTransactions}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Payment Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage all payment transactions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-gray-900">{txn.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-gray-900">₹{txn.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{txn.currency}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {txn.method || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{txn.email || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{txn.contact || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDate(txn.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {txn.status === 'captured' && (
                        <button
                          onClick={() => handleRefund(txn.id, txn.amount)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-colors border border-red-200"
                        >
                          <FaUndo className="text-xs" />
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
