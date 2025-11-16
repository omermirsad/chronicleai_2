/**
 * Health Check Page
 * Provides application health status for monitoring
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { config } from '../config';
import { performanceMonitor } from '../lib/performanceMonitoring';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    storage: boolean;
    config: boolean;
  };
  performance?: {
    pageLoad?: number;
    metrics: Record<string, number>;
  };
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);

    const checks = {
      database: false,
      storage: false,
      config: false,
    };

    // Check database connection
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      checks.database = !error || error.code === 'PGRST116'; // PGRST116 = no rows, which is ok
    } catch {
      checks.database = false;
    }

    // Check storage
    try {
      const { error } = await supabase.storage.from('journal-photos').list('', { limit: 1 });
      checks.storage = !error || error.message.includes('not found');
    } catch {
      checks.storage = false;
    }

    // Check configuration
    checks.config = !!(config.supabase.url && config.supabase.anonKey);

    // Determine overall status
    const allHealthy = Object.values(checks).every(check => check);
    const someHealthy = Object.values(checks).some(check => check);

    const status: HealthStatus['status'] = allHealthy
      ? 'healthy'
      : someHealthy
      ? 'degraded'
      : 'unhealthy';

    // Collect performance metrics
    const metrics: Record<string, number> = {};
    const metricNames = ['LCP', 'FID', 'CLS', 'TTFB'];

    for (const name of metricNames) {
      const avg = performanceMonitor.getAverageMetric(name);
      if (avg !== null) {
        metrics[name] = avg;
      }
    }

    setHealth({
      status,
      timestamp: new Date().toISOString(),
      version: config.app.version,
      checks,
      performance: {
        pageLoad: performanceMonitor.getPageLoadTime() || undefined,
        metrics,
      },
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">Checking health...</div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-red-600">Health check failed</div>
      </div>
    );
  }

  const statusColor = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    unhealthy: 'text-red-600',
  }[health.status];

  const statusBg = {
    healthy: 'bg-green-50',
    degraded: 'bg-yellow-50',
    unhealthy: 'bg-red-50',
  }[health.status];

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">
          Application Health Status
        </h1>

        <div className={`${statusBg} border-2 border-current ${statusColor} rounded-lg p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold capitalize">{health.status}</h2>
              <p className="text-sm mt-1">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-stone-600">Version</div>
              <div className="text-lg font-mono">{health.version}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <HealthCard
            title="Database"
            status={health.checks.database}
            description="Supabase PostgreSQL connection"
          />
          <HealthCard
            title="Storage"
            status={health.checks.storage}
            description="File storage availability"
          />
          <HealthCard
            title="Configuration"
            status={health.checks.config}
            description="Environment variables"
          />
        </div>

        {health.performance && Object.keys(health.performance.metrics).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-stone-800 mb-4">
              Performance Metrics
            </h3>

            {health.performance.pageLoad && (
              <div className="mb-4">
                <div className="text-sm text-stone-600">Page Load Time</div>
                <div className="text-2xl font-bold text-stone-800">
                  {health.performance.pageLoad.toFixed(0)}ms
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health.performance.metrics).map(([name, value]) => (
                <div key={name}>
                  <div className="text-xs text-stone-600">{name}</div>
                  <div className="text-lg font-semibold text-stone-800">
                    {value.toFixed(2)}
                    {name === 'CLS' ? '' : 'ms'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={checkHealth}
            className="px-6 py-2 bg-stone-800 text-white rounded-md hover:bg-stone-700 transition"
          >
            Refresh
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-stone-500">
          <p>This page is for monitoring purposes only.</p>
          <p>Access at: /health</p>
        </div>
      </div>
    </div>
  );
}

interface HealthCardProps {
  title: string;
  status: boolean;
  description: string;
}

function HealthCard({ title, status, description }: HealthCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 border-2 ${
      status ? 'border-green-200' : 'border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-stone-800">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${
          status ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>
      <p className="text-sm text-stone-600">{description}</p>
      <p className={`text-xs mt-2 font-medium ${
        status ? 'text-green-600' : 'text-red-600'
      }`}>
        {status ? '✓ Operational' : '✗ Unavailable'}
      </p>
    </div>
  );
}
