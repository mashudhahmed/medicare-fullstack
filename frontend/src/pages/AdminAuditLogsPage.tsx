import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import { AuditLog } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui';
import {
  FaHistory,
  FaSearch,
  FaSyncAlt,
  FaInfoCircle,
  FaDesktop,
  FaShieldAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;

      const data = await adminApi.getAuditLogs(params);
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const emailMatch = log.user_email?.toLowerCase().includes(query) || false;
    const resourceMatch = log.resource_type?.toLowerCase().includes(query) || false;
    const idMatch = log.resource_id?.toLowerCase().includes(query) || false;
    const ipMatch = log.ip_address?.toLowerCase().includes(query) || false;
    return !searchQuery || emailMatch || resourceMatch || idMatch || ipMatch;
  });

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return <span className="badge badge-success">CREATE</span>;
      case 'UPDATE':
        return <span className="badge badge-info">UPDATE</span>;
      case 'DELETE':
        return <span className="badge badge-danger">DELETE</span>;
      case 'LOGIN':
        return <span className="badge bg-indigo-100 text-indigo-800">LOGIN</span>;
      case 'LOGOUT':
        return <span className="badge bg-gray-100 text-gray-800">LOGOUT</span>;
      default:
        return <span className="badge">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaShieldAlt className="text-medicare-primary" />
            Security & System Audit Logs
          </h1>
          <p className="text-sm text-gray-500">
            Real-time immutable audit trail of system activities, user authentication, and data modifications.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="btn-secondary flex items-center gap-2 self-start sm:self-auto text-sm"
        >
          <FaSyncAlt />
          Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user email, resource ID, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field w-36"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="VIEW">VIEW</option>
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Resources</option>
            <option value="User">User</option>
            <option value="Doctor">Doctor</option>
            <option value="Patient">Patient</option>
            <option value="Appointment">Appointment</option>
            <option value="Prescription">Prescription</option>
            <option value="Billing">Billing</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaHistory />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No Audit Logs Found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || actionFilter || resourceFilter
                ? 'No logs matched the selected filters.'
                : 'There are no audit events recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Resource ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{log.user_email || 'System'}</div>
                        {log.user_role && (
                          <span className="text-[10px] uppercase font-semibold text-gray-400">
                            {log.user_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {log.resource_type || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 max-w-[140px] truncate" title={log.resource_id || ''}>
                      {log.resource_id || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-medicare-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <FaInfoCircle /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Log ID:</span>
                <span className="font-mono text-gray-800 break-all">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Timestamp:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Action:</span>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <span className="text-gray-500 block">User:</span>
                <span className="font-medium text-gray-800">
                  {selectedLog.user_email || 'System'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Resource Type:</span>
                <span className="font-semibold text-gray-800">{selectedLog.resource_type || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Resource ID:</span>
                <span className="font-mono text-gray-800">{selectedLog.resource_id || '-'}</span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-gray-500 block">IP Address:</span>
                <span className="font-mono text-gray-800">{selectedLog.ip_address || '-'}</span>
              </div>
            </div>

            {selectedLog.user_agent && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1 font-medium">
                  <FaDesktop /> User Agent
                </div>
                <p className="text-xs font-mono text-gray-700 break-all">{selectedLog.user_agent}</p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">
                Event Payload / Details:
              </span>
              <pre className="p-3 bg-gray-900 text-green-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                {selectedLog.details
                  ? JSON.stringify(selectedLog.details, null, 2)
                  : 'No additional details recorded for this action.'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogsPage;
