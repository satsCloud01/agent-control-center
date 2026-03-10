import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Eye, EyeOff, Server, Heart, Shield } from 'lucide-react';
import { api } from '../lib/api';

const KEY_CONFIGS = [
  { label: 'OpenAI API Key', storageKey: 'acc_openai_key', placeholder: 'sk-...' },
  { label: 'Anthropic API Key', storageKey: 'acc_anthropic_key', placeholder: 'sk-ant-...' },
  { label: 'Tavily API Key', storageKey: 'acc_tavily_key', placeholder: 'tvly-...' },
];

const PROVIDERS: Record<string, string[]> = {
  Anthropic: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250414'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
};

export default function Settings() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<any>(null);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    // Load keys from localStorage
    const loaded: Record<string, string> = {};
    KEY_CONFIGS.forEach((k) => {
      loaded[k.storageKey] = localStorage.getItem(k.storageKey) || '';
    });
    setKeys(loaded);

    // Load platform config
    api
      .getSettings()
      .then((data) => setPlatformConfig(data))
      .catch(() => setPlatformConfig(null))
      .finally(() => setConfigLoading(false));
  }, []);

  function handleSave() {
    KEY_CONFIGS.forEach((k) => {
      const val = keys[k.storageKey] || '';
      if (val) {
        localStorage.setItem(k.storageKey, val);
      } else {
        localStorage.removeItem(k.storageKey);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function checkHealth() {
    setHealthLoading(true);
    setHealthResult(null);
    try {
      const data = await api.health();
      setHealthResult({ ok: true, data });
    } catch (e: any) {
      setHealthResult({ ok: false, error: e.message });
    } finally {
      setHealthLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600/20 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">API keys, platform configuration, and health</p>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
        </div>
        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-2.5">
          <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-xs text-yellow-300">
            API keys are stored in your browser only and never sent to the server for storage.
          </span>
        </div>
        <div className="space-y-4">
          {KEY_CONFIGS.map((cfg) => (
            <div key={cfg.storageKey}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {cfg.label}
              </label>
              <div className="relative">
                <input
                  type={visibility[cfg.storageKey] ? 'text' : 'password'}
                  value={keys[cfg.storageKey] || ''}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [cfg.storageKey]: e.target.value }))
                  }
                  placeholder={cfg.placeholder}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisibility((prev) => ({
                      ...prev,
                      [cfg.storageKey]: !prev[cfg.storageKey],
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {visibility[cfg.storageKey] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Platform Config */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Platform Configuration</h2>
        </div>
        {configLoading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : platformConfig ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Default Provider', value: platformConfig.default_provider },
              { label: 'Default Model', value: platformConfig.default_model },
              { label: 'Max Tokens', value: platformConfig.max_tokens },
              { label: 'Temperature', value: platformConfig.temperature },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-950/60 border border-slate-800/50 rounded-lg px-4 py-3"
              >
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="text-sm text-slate-200 font-mono">
                  {item.value !== undefined && item.value !== null ? String(item.value) : '-'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Could not load platform configuration.</p>
        )}
      </div>

      {/* Available Providers */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Available Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PROVIDERS).map(([provider, models]) => (
            <div
              key={provider}
              className="bg-slate-950/60 border border-slate-800/50 rounded-lg px-5 py-4"
            >
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">{provider}</h3>
              <ul className="space-y-1">
                {models.map((m) => (
                  <li key={m} className="text-xs text-slate-400 font-mono">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Health Check */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Health Check</h2>
        </div>
        <button
          onClick={checkHealth}
          disabled={healthLoading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {healthLoading ? 'Checking...' : 'Run Health Check'}
        </button>
        {healthResult && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              healthResult.ok
                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                : 'bg-red-900/30 border-red-700/50 text-red-300'
            }`}
          >
            {healthResult.ok ? (
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(healthResult.data, null, 2)}
              </pre>
            ) : (
              <span>Health check failed: {healthResult.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
