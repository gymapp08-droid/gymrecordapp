import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { ReportType, IReportDataSummary, IPortalClientSummary } from '@alpha/types';

interface ReportsViewProps {
  clients: IPortalClientSummary[];
  onGenerateReport: (dto: {
    type: ReportType;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<IReportDataSummary>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ clients, onGenerateReport }) => {
  const [selectedType, setSelectedType] = useState<ReportType>('CLIENT_PROGRESS');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('2026-02-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0] || '');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<IReportDataSummary | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const rep = await onGenerateReport({
        type: selectedType,
        clientId: selectedClientId === 'ALL' ? undefined : selectedClientId,
        dateFrom,
        dateTo,
      });
      setGeneratedReport(rep);
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!generatedReport) return;
    let csv = 'Client ID,Client Name,Compliance Rate (%),Key Metric\n';
    if (generatedReport.clientSummary) {
      for (const c of generatedReport.clientSummary) {
        csv += `"${c.clientId}","${c.clientName}",${c.complianceRate},"${c.keyMetricValue}"\n`;
      }
    }
    csv += '\nMetric,Value\n';
    for (const [k, v] of Object.entries(generatedReport.metrics)) {
      csv += `"${k}","${v}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpha_report_${generatedReport.type.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Coaching Reports & Data Export
        </h1>
        <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
          Generate auditable compliance, progression, and organizational reports with 1-click CSV/JSON export.
        </p>
      </div>

      {/* Generator Configuration Card */}
      <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginBottom: '16px' }}>
          Report Generator Parameters
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
              Report Type *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="CLIENT_PROGRESS" style={{ background: '#0C1018' }}>Client Progress & 1RM Curves</option>
              <option value="WORKOUT_ADHERENCE" style={{ background: '#0C1018' }}>Workout Adherence & Tonnage</option>
              <option value="NUTRITION_ADHERENCE" style={{ background: '#0C1018' }}>Nutrition Logging & Macros</option>
              <option value="ORGANIZATION_OVERVIEW" style={{ background: '#0C1018' }}>Organization Cohort Overview</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
              Scope (Athlete)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="ALL" style={{ background: '#0C1018' }}>Entire Active Roster (Cohort)</option>
              {(clients || []).map((c) => (
                <option key={c.clientId} value={c.clientId} style={{ background: '#0C1018' }}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
              Date Window
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  color: STITCH_THEME.colors.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  color: STITCH_THEME.colors.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              height: '40px',
              justifyContent: 'center',
            }}
          >
            {loading ? 'Compiling Data...' : '⚡ Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Result Preview */}
      {generatedReport ? (
        <div style={{ ...STITCH_THEME.styles.glassCardElevated, padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: STITCH_THEME.colors.accentEmerald,
                    fontWeight: 700,
                  }}
                >
                  READY FOR EXPORT
                </span>
                <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                  Generated at {new Date(generatedReport.generatedAt).toLocaleTimeString()}
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '8px 0 0 0', color: STITCH_THEME.colors.textPrimary }}>
                {generatedReport.title}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadCsv}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  borderColor: STITCH_THEME.colors.accentCyan,
                  color: STITCH_THEME.colors.accentCyan,
                }}
              >
                📥 Download CSV
              </button>
              <button
                onClick={() => alert(`JSON Payload:\n${JSON.stringify(generatedReport.metrics, null, 2)}`)}
                style={STITCH_THEME.styles.secondaryButton}
              >
                View JSON
              </button>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(generatedReport.metrics).map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                  {k.replace(/([A-Z])/g, ' $1')}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '4px' }}>
                  {typeof v === 'number' && k.includes('Rate') ? `${v}%` : String(v)}
                </div>
              </div>
            ))}
          </div>

          {/* Client Breakdown Table */}
          {generatedReport.clientSummary && generatedReport.clientSummary.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginBottom: '12px' }}>
                ATHLETE COMPLIANCE & PERFORMANCE SUMMARY
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`, textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: STITCH_THEME.colors.textMuted, fontSize: '11px' }}>ATHLETE</th>
                    <th style={{ padding: '10px', color: STITCH_THEME.colors.textMuted, fontSize: '11px' }}>COMPLIANCE RATE</th>
                    <th style={{ padding: '10px', color: STITCH_THEME.colors.textMuted, fontSize: '11px' }}>KEY METRIC VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.clientSummary.map((c) => (
                    <tr key={c.clientId} style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}` }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                        {c.clientName}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ color: c.complianceRate >= 80 ? STITCH_THEME.colors.accentEmerald : STITCH_THEME.colors.accentAmber, fontWeight: 700 }}>
                          {c.complianceRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: STITCH_THEME.colors.textSecondary }}>
                        {c.keyMetricValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0' }}>No Report Generated Yet</h3>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, maxWidth: '440px', margin: '0 auto' }}>
            Select your desired report criteria above and click <strong>Generate Report</strong> to compile client analytics.
          </p>
        </div>
      )}
    </div>
  );
};
