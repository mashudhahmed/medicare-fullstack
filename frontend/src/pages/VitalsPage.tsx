import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import vitalsApi from '../api/vitals';
import patientsApi from '../api/patients';
import type { PatientVital, CreatePatientVitalData, Patient } from '../types';
import {
  FaHeartbeat,
  FaPlus,
  FaTrash,
  FaWeight,
  FaTint,
  FaChartLine,
  FaTable,
  FaTimes,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export const VitalsPage: React.FC = () => {
  const { user } = useAuth();
  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';

  const [vitals, setVitals] = useState<PatientVital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active chart tab: 'bp' | 'glucose' | 'bmi' | 'pulse'
  const [activeTab, setActiveTab] = useState<'bp' | 'glucose' | 'bmi' | 'pulse'>('bp');

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreatePatientVitalData>({
    patient: '',
    systolic_bp: undefined,
    diastolic_bp: undefined,
    heart_rate: undefined,
    blood_glucose: undefined,
    glucose_context: 'random',
    body_temperature: undefined,
    oxygen_saturation: undefined,
    weight_kg: undefined,
    height_cm: undefined,
    notes: '',
  });

  // Fetch patients if doctor or admin
  useEffect(() => {
    if (isDoctorOrAdmin) {
      patientsApi
        .getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setPatients(list);
          if (list.length > 0 && !selectedPatientId) {
            setSelectedPatientId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isDoctorOrAdmin]);

  // Fetch vitals
  const fetchVitals = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: PatientVital[] = [];
      if (isDoctorOrAdmin) {
        data = await vitalsApi.getAll(selectedPatientId || undefined);
      } else {
        data = await vitalsApi.getAll();
      }
      // Sort ascending by recorded_at for chronological charting
      const sorted = [...data].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      setVitals(sorted);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load vitals records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [selectedPatientId]);

  // Latest vital sign reading
  const latestVital = useMemo(() => {
    if (vitals.length === 0) return null;
    return vitals[vitals.length - 1];
  }, [vitals]);

  // Live BMI calculation preview for modal
  const liveBmi = useMemo(() => {
    const w = formData.weight_kg;
    const h = formData.height_cm;
    if (w && h && h > 0) {
      const hm = h / 100;
      const val = w / (hm * hm);
      const rounded = Math.round(val * 10) / 10;
      let category = 'Normal';
      if (rounded < 18.5) category = 'Underweight';
      else if (rounded < 25.0) category = 'Normal';
      else if (rounded < 30.0) category = 'Overweight';
      else category = 'Obese';
      return { val: rounded, category };
    }
    return null;
  }, [formData.weight_kg, formData.height_cm]);

  // Handle Create Vital Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload: CreatePatientVitalData = {
        ...formData,
        patient: isDoctorOrAdmin ? formData.patient || selectedPatientId : undefined,
      };

      await vitalsApi.create(payload);
      setShowLogModal(false);
      setSuccessMessage('Vitals recorded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Reset form
      setFormData({
        patient: selectedPatientId,
        systolic_bp: undefined,
        diastolic_bp: undefined,
        heart_rate: undefined,
        blood_glucose: undefined,
        glucose_context: 'random',
        body_temperature: undefined,
        oxygen_saturation: undefined,
        weight_kg: undefined,
        height_cm: undefined,
        notes: '',
      });

      await fetchVitals();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})[0] ||
        'Failed to record vitals.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this vitals entry?')) return;
    try {
      setDeletingId(id);
      await vitalsApi.delete(id);
      setSuccessMessage('Vital record removed.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setVitals((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete vital record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Format data points for recharts
  const chartData = useMemo(() => {
    return vitals.map((v) => {
      const d = new Date(v.recorded_at);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return {
        timestamp: dateStr,
        fullDate: d.toLocaleString(),
        systolic: v.systolic_bp || null,
        diastolic: v.diastolic_bp || null,
        heart_rate: v.heart_rate || null,
        blood_glucose: v.blood_glucose ? Number(v.blood_glucose) : null,
        context: v.glucose_context,
        temperature: v.body_temperature ? Number(v.body_temperature) : null,
        oxygen: v.oxygen_saturation || null,
        weight: v.weight_kg ? Number(v.weight_kg) : null,
        bmi: v.bmi ? Number(v.bmi) : null,
      };
    });
  }, [vitals]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl">
              <FaHeartbeat />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {isDoctorOrAdmin ? 'Patient Health Vitals Tracker' : 'My Health Vitals Tracker'}
              </h1>
              <p className="text-sm text-slate-500">
                Log biometric indicators, track longitudinal trends, and monitor cardiovascular metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDoctorOrAdmin && patients.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Patient:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user?.full_name || 'Patient'} ({p.blood_group || 'No BG'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                patient: selectedPatientId,
              }));
              setShowLogModal(true);
            }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            <FaPlus className="text-sm" />
            <span>Log New Vitals</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <FaTimes />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <FaCheckCircle className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blood Pressure</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-sm">
              <FaHeartbeat />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {latestVital?.bp_reading ? `${latestVital.bp_reading}` : '--/--'}
              <span className="text-xs font-normal text-slate-400 ml-1.5">mmHg</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {latestVital?.systolic_bp && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    latestVital.systolic_bp < 120 && (latestVital.diastolic_bp || 0) < 80
                      ? 'bg-emerald-100 text-emerald-700'
                      : latestVital.systolic_bp < 130 && (latestVital.diastolic_bp || 0) < 80
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {latestVital.systolic_bp < 120 && (latestVital.diastolic_bp || 0) < 80
                    ? 'Normal'
                    : latestVital.systolic_bp < 130 && (latestVital.diastolic_bp || 0) < 80
                    ? 'Elevated'
                    : 'High'}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {latestVital ? new Date(latestVital.recorded_at).toLocaleDateString() : 'No data'}
              </span>
            </div>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Heart Rate / Pulse</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm">
              <FaHeartbeat />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {latestVital?.heart_rate ? latestVital.heart_rate : '--'}
              <span className="text-xs font-normal text-slate-400 ml-1.5">bpm</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Target resting: 60 - 100 bpm</span>
            </div>
          </div>
        </div>

        {/* Blood Glucose Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blood Glucose</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-sm">
              <FaTint />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {latestVital?.blood_glucose ? latestVital.blood_glucose : '--'}
              <span className="text-xs font-normal text-slate-400 ml-1.5">mg/dL</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {latestVital?.glucose_context && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">
                  {latestVital.glucose_context.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BMI & Weight Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">BMI & Weight</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              <FaWeight />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {latestVital?.bmi ? latestVital.bmi : '--'}
              <span className="text-xs font-normal text-slate-400 ml-1.5">BMI</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {latestVital?.bmi_category && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    latestVital.bmi_category === 'Normal'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {latestVital.bmi_category}
                </span>
              )}
              {latestVital?.weight_kg && (
                <span className="text-xs text-slate-400">{latestVital.weight_kg} kg</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">Longitudinal Health Trends</h2>
          </div>

          {/* Chart View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('bp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'bp'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blood Pressure
            </button>
            <button
              onClick={() => setActiveTab('glucose')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'glucose'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blood Glucose
            </button>
            <button
              onClick={() => setActiveTab('pulse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'pulse'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pulse & SpO2
            </button>
            <button
              onClick={() => setActiveTab('bmi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'bmi'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weight & BMI
            </button>
          </div>
        </div>

        {/* Chart Rendering Container */}
        <div className="h-80 w-full min-w-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading vitals trends...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <FaHeartbeat className="text-4xl text-slate-300" />
              <p className="text-sm">No vitals logged yet. Click "Log New Vitals" above to start tracking.</p>
            </div>
          ) : activeTab === 'bp' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[40, 200]} stroke="#94a3b8" fontSize={12} unit=" mmHg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal Systolic (120)', fill: '#10b981', fontSize: 11 }} />
                <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Normal Diastolic (80)', fill: '#3b82f6', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic BP"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic BP"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : activeTab === 'glucose' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[50, 300]} stroke="#94a3b8" fontSize={12} unit=" mg/dL" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal Fasting (100)', fill: '#10b981', fontSize: 11 }} />
                <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Post-Meal Normal (140)', fill: '#f59e0b', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="blood_glucose"
                  name="Blood Glucose (mg/dL)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#0d9488' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : activeTab === 'pulse' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[40, 150]} stroke="#94a3b8" fontSize={12} unit=" bpm" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  name="Pulse / Heart Rate (bpm)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="oxygen"
                  name="SpO2 Oxygen (%)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Overweight Threshold (25)', fill: '#f59e0b', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="bmi"
                  name="Body Mass Index (BMI)"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8b5cf6' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f97316' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTable className="text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">Recorded Vitals Log History</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Records: {vitals.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Recorded At</th>
                <th className="px-5 py-3.5">BP (mmHg)</th>
                <th className="px-5 py-3.5">Pulse</th>
                <th className="px-5 py-3.5">Glucose</th>
                <th className="px-5 py-3.5">SpO2 / Temp</th>
                <th className="px-5 py-3.5">Weight / BMI</th>
                <th className="px-5 py-3.5">Recorded By</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vitals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No vital signs recorded yet.
                  </td>
                </tr>
              ) : (
                [...vitals].reverse().map((vital) => (
                  <tr key={vital.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                      {new Date(vital.recorded_at).toLocaleDateString()}{' '}
                      <span className="text-xs text-slate-400 font-normal">
                        {new Date(vital.recorded_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {vital.bp_reading ? (
                        <span className="font-semibold text-slate-800">{vital.bp_reading}</span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {vital.heart_rate ? `${vital.heart_rate} bpm` : <span className="text-slate-300">--</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {vital.blood_glucose ? (
                        <div>
                          <span className="font-medium text-slate-800">{vital.blood_glucose} mg/dL</span>
                          <span className="block text-[11px] text-slate-400 capitalize">
                            {vital.glucose_context.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      <div>SpO2: {vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : '--'}</div>
                      <div>Temp: {vital.body_temperature ? `${vital.body_temperature}°F` : '--'}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {vital.bmi ? (
                        <div>
                          <span className="font-semibold text-slate-800">{vital.bmi} BMI</span>
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              vital.bmi_category === 'Normal'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {vital.bmi_category}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {vital.weight_kg ? `${vital.weight_kg}kg` : ''}
                            {vital.height_cm ? `, ${vital.height_cm}cm` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                      {vital.recorded_by_name || 'Self'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {vital.notes || '--'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(vital.id)}
                        disabled={deletingId === vital.id}
                        className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete Record"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Vitals Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in duration-200">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
                <FaHeartbeat />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Log Health Vitals</h3>
                <p className="text-xs text-slate-500">Enter your health metrics for monitoring and trends</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {isDoctorOrAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Select Patient *
                  </label>
                  <select
                    required
                    value={formData.patient}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user?.full_name} ({p.user?.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Blood Pressure Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Blood Pressure (mmHg)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Systolic (e.g. 120)"
                      min={50}
                      max={260}
                      value={formData.systolic_bp ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          systolic_bp: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400">Systolic (Top)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Diastolic (e.g. 80)"
                      min={30}
                      max={180}
                      value={formData.diastolic_bp ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          diastolic_bp: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400">Diastolic (Bottom)</span>
                  </div>
                </div>
              </div>

              {/* Heart Rate & SpO2 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pulse / Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    min={30}
                    max={250}
                    value={formData.heart_rate ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        heart_rate: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 98"
                    min={50}
                    max={100}
                    value={formData.oxygen_saturation ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oxygen_saturation: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Blood Glucose & Context */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 95.0"
                    min={20}
                    max={600}
                    value={formData.blood_glucose ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        blood_glucose: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Glucose Context
                  </label>
                  <select
                    value={formData.glucose_context}
                    onChange={(e: any) =>
                      setFormData({ ...formData, glucose_context: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="random">Random</option>
                    <option value="fasting">Fasting</option>
                    <option value="post_meal">After Meal (Post-prandial)</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Body Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  min={90}
                  max={110}
                  value={formData.body_temperature ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      body_temperature: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Weight & Height with Live BMI */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Anthropometrics (Weight & Height)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight (kg)"
                      min={2}
                      max={350}
                      value={formData.weight_kg ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight_kg: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Height (cm)"
                      min={30}
                      max={260}
                      value={formData.height_cm ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          height_cm: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live BMI Preview */}
                {liveBmi && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Calculated BMI:</span>
                    <span className="font-bold text-slate-800">
                      {liveBmi.val} ({liveBmi.category})
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Clinical Notes / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Normal morning reading, taken before breakfast"
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Vitals Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalsPage;
