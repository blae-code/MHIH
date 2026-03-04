import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save, RotateCcw } from 'lucide-react';

const DEFAULT_PREFS = {
  data_source_failure: { enabled: true, channels: ['in_app', 'email'] },
  data_source_success: { enabled: false, channels: ['in_app'] },
  ai_insight: { enabled: true, channels: ['in_app', 'email'] },
  health_alert: { enabled: true, channels: ['in_app', 'email'] },
  quality_flag: { enabled: true, channels: ['in_app'] },
  system_info: { enabled: false, channels: ['in_app'] }
};

const NOTIFICATION_TYPES = {
  data_source_failure: { label: 'Data Source Failures', description: 'When a data source fails to sync' },
  data_source_success: { label: 'Successful Syncs', description: 'When a data source syncs successfully' },
  ai_insight: { label: 'New AI Insights', description: 'When AI generates new insights from your data' },
  health_alert: { label: 'Health Alerts', description: 'When significant changes in indicators are detected' },
  quality_flag: { label: 'Data Quality Issues', description: 'When quality issues are detected' },
  system_info: { label: 'System Information', description: 'General system updates and information' }
};

export default function NotificationPreferences({ isOpen, onClose, user }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [prefId, setPrefId] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    loadPreferences();
  }, [isOpen, user]);

  const loadPreferences = async () => {
    try {
      const data = await base44.entities.NotificationPreference.filter({ user_email: user.email });
      if (data.length) {
        setPrefId(data[0].id);
        const loaded = {};
        for (const type of Object.keys(DEFAULT_PREFS)) {
          loaded[type] = data[0][type] || DEFAULT_PREFS[type];
        }
        setPrefs(loaded);
      } else {
        setPrefs(DEFAULT_PREFS);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = (type) => {
    setPrefs(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled }
    }));
    setSaved(false);
  };

  const handleToggleChannel = (type, channel) => {
    setPrefs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        channels: prev[type].channels.includes(channel)
          ? prev[type].channels.filter(c => c !== channel)
          : [...prev[type].channels, channel]
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      if (prefId) {
        await base44.entities.NotificationPreference.update(prefId, prefs);
      } else {
        const result = await base44.entities.NotificationPreference.create({
          user_email: user.email,
          ...prefs
        });
        setPrefId(result.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFS);
    setSaved(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-96 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h2>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading preferences...</p>
          ) : (
            Object.entries(NOTIFICATION_TYPES).map(([type, { label, description }]) => (
              <div
                key={type}
                className="p-3 rounded-lg"
                style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input
                        type="checkbox"
                        checked={prefs[type]?.enabled || false}
                        onChange={() => handleToggleType(type)}
                        className="rounded"
                      />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {label}
                      </span>
                    </label>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {description}
                    </p>
                  </div>
                </div>

                {prefs[type]?.enabled && (
                  <div className="flex items-center gap-3 ml-6 pt-2">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Send via:</span>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={prefs[type]?.channels?.includes('in_app') || false}
                        onChange={() => handleToggleChannel(type, 'in_app')}
                        className="rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>In-app</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={prefs[type]?.channels?.includes('email') || false}
                        onChange={() => handleToggleChannel(type, 'email')}
                        className="rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                    </label>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-2">
            {saved && (
              <p className="text-xs" style={{ color: 'var(--color-success)' }}>✓ Preferences saved</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'var(--mnbc-yellow)',
                border: 'none',
                color: '#000'
              }}
            >
              <Save size={12} />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}