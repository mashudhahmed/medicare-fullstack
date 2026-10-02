import React, { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../api/billing';
import { Billing } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaCreditCard,
  FaMoneyBillWave,
  FaCalendar,
  FaFilePdf,
  FaCheckCircle,
  FaSearch,
  FaSyncAlt,
  FaReceipt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await billingApi.getInvoices();
      const list = Array.isArray(data) ? data : data?.results || [];
      setBillings(list);
    } catch {
      toast.error('Failed to fetch billing records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const handleDownloadPdf = async (billing: Billing) => {
    try {
      toast.loading('Generating official receipt PDF...', { id: 'pdf-toast' });
      await billingApi.downloadPdf(billing.id, `Invoice_${billing.invoice_number}.pdf`);
      toast.success('Official PDF receipt downloaded!', { id: 'pdf-toast' });
    } catch {
      toast.error('Failed to download invoice PDF', { id: 'pdf-toast' });
    }
  };

  const handlePaySettlement = async (billing: Billing) => {
    try {
      setPayingId(billing.id);
      await billingApi.pay(billing.id, { payment_method: 'cash' });
      toast.success(`Invoice #${billing.invoice_number} marked as Paid!`);
      await fetchBillings();
    } catch {
      toast.error('Failed to process payment settlement');
    } finally {
      setPayingId(null);
    }
  };

  const filteredBillings = billings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      b.invoice_number.toLowerCase().includes(query) ||
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.patient_details?.user?.full_name && b.patient_details.user.full_name.toLowerCase().includes(query));
    return matchesStatus && (!searchQuery || matchesSearch);
  });

  const totalAmount = billings
    .reduce((sum, b) => sum + parseFloat(b.total_amount || b.amount || '0'), 0)
    .toFixed(2);

  const paidAmount = billings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || b.amount || '0'), 0)
    .toFixed(2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success font-medium">Paid</span>;
      case 'pending':
        return <span className="badge badge-warning font-medium">Pending</span>;
      case 'overdue':
        return <span className="badge badge-danger font-medium">Overdue</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading && billings.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaReceipt className="text-medicare-primary" />
            Billing & Invoices
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'patient'
              ? 'View your medical bills, payment receipts, and settlement history.'
              : 'Hospital billing directory, receipts generation, and payment desk settlement.'}
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-right shadow-sm">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Total Billed</span>
            <span className="text-base font-bold text-gray-800">${totalAmount}</span>
          </div>
          <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-right shadow-sm">
            <span className="text-[11px] text-teal-700 uppercase font-semibold block">Total Settled</span>
            <span className="text-base font-bold text-teal-800">${paidAmount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice #, description, or patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-36"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button
            onClick={() => fetchBillings()}
            className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition"
            title="Refresh"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4">
        {filteredBillings.length === 0 ? (
          <div className="card text-center py-12">
            <FaCreditCard className="text-4xl mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-700">No Billing Records Found</h3>
            <p className="text-gray-400 text-xs mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'No invoices match your selected search or filter criteria.'
                : 'There are no billing records logged in the system.'}
            </p>
          </div>
        ) : (
          filteredBillings.map((billing) => (
            <div
              key={billing.id}
              className="card flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-medicare-dark">
                    #{billing.invoice_number}
                  </h3>
                  {getStatusBadge(billing.status)}
                </div>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p className="text-sm font-semibold text-gray-800">
                    <FaMoneyBillWave className="inline mr-1.5 text-teal-600" /> $
                    {billing.total_amount || billing.amount}
                  </p>
                  <p>
                    <FaCalendar className="inline mr-1.5 text-gray-400" />
                    Due: {billing.due_date ? new Date(billing.due_date).toLocaleDateString() : 'Immediate'}
                  </p>
                  {billing.description && (
                    <p className="text-gray-500 italic">{billing.description}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {billing.status === 'pending' && (
                  <button
                    onClick={() => handlePaySettlement(billing)}
                    disabled={payingId === billing.id}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <FaCheckCircle />{' '}
                    {payingId === billing.id ? 'Processing...' : 'Settle Bill (Cash/Desk)'}
                  </button>
                )}
                <button
                  onClick={() => handleDownloadPdf(billing)}
                  className="btn-outline text-xs flex items-center gap-1.5 border-teal-600 text-teal-700 hover:bg-teal-50"
                  title="Download Official Invoice / Receipt PDF"
                >
                  <FaFilePdf className="text-teal-600" /> Download PDF Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingPage;