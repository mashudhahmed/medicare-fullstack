import React, { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../api/billing';
import { Billing } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaCreditCard, FaMoneyBillWave, FaCalendar } from 'react-icons/fa';

const BillingPage: React.FC = () => {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBillings = useCallback(async () => {
    try {
      const data = await billingApi.getInvoices();
      setBillings(data.results || []);
    } catch {
      console.error('Failed to fetch billings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadBillings = async () => {
      await fetchBillings();
    };
    loadBillings();
  }, [fetchBillings]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'badge-warning',
      paid: 'badge-success',
      overdue: 'badge-danger',
      cancelled: 'badge-secondary',
    };
    return colors[status] || 'badge-secondary';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medicare-dark">Billing</h1>
        <span className="text-sm text-gray-600">
          Total: $
          {billings
            .reduce((sum, b) => sum + parseFloat(b.total_amount || '0'), 0)
            .toFixed(2)}
        </span>
      </div>

      <div className="grid gap-4">
        {billings.length === 0 ? (
          <div className="card text-center py-12">
            <FaCreditCard className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No billing records found</p>
          </div>
        ) : (
          billings.map((billing) => (
            <div
              key={billing.id}
              className="card flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-medicare-dark">
                    #{billing.invoice_number}
                  </h3>
                  <span className={`badge ${getStatusColor(billing.status)}`}>
                    {billing.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p>
                    <FaMoneyBillWave className="inline mr-2" /> $
                    {billing.total_amount}
                  </p>
                  <p>
                    <FaCalendar className="inline mr-2" />
                    Due: {new Date(billing.due_date).toLocaleDateString()}
                  </p>
                  {billing.description && <p>{billing.description}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingPage;