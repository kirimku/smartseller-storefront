import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'session_created' | 'session_validated' | 'security_warning' | 'suspicious_activity';
  message: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

export const SecurityDashboard: React.FC = () => {
  const { 
    sessionRiskLevel, 
    isSessionValid, 
    hasHighRiskEvents, 
    isSessionExpiringSoon,
    validateSession,
    updateActivity
  } = useAuth();
  
  const { getSecurityEvents, clearSecurityEvents } = useSessionManager();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = async () => {
    try {
      const events = await getSecurityEvents();
      setSecurityEvents(events);
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await validateSession();
      updateActivity();
      await loadSecurityEvents();
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearEvents = async () => {
    try {
      await clearSecurityEvents();
      setSecurityEvents([]);
    } catch (error) {
      console.error('Failed to clear security events:', error);
    }
  };

  const getRiskLevelIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'medium':
        return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'high':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
    }
  };

  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getEventTypeIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
      case 'session_created':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-gray-500" />;
      case 'session_validated':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'security_warning':
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Security Dashboard
        </h2>
        <button
          onClick={handleRefreshSession}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Session Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${getRiskLevelColor(sessionRiskLevel)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getRiskLevelIcon(sessionRiskLevel)}
            <span className="font-medium">Risk Level</span>
          </div>
          <p className="text-sm capitalize">{sessionRiskLevel}</p>
        </div>

        <div className={`p-4 rounded-lg border ${isSessionValid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isSessionValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span className="font-medium">Session Status</span>
          </div>
          <p className="text-sm">{isSessionValid ? 'Valid' : 'Invalid'}</p>
        </div>

        <div className={`p-4 rounded-lg border ${hasHighRiskEvents ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Security Alerts</span>
          </div>
          <p className="text-sm">{hasHighRiskEvents ? 'Active' : 'None'}</p>
        </div>

        <div className={`p-4 rounded-lg border ${isSessionExpiringSoon ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Session Expiry</span>
          </div>
          <p className="text-sm">{isSessionExpiringSoon ? 'Expiring Soon' : 'Active'}</p>
        </div>
      </div>

      {/* Security Events */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {showEvents ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showEvents ? 'Hide' : 'Show'} Events
            </button>
            {securityEvents.length > 0 && (
              <button
                onClick={handleClearEvents}
                className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
              >
                Clear Events
              </button>
            )}
          </div>
        </div>

        {showEvents && (
          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No security events recorded</p>
            ) : (
              securityEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${getRiskLevelColor(event.riskLevel)}`}
                >
                  <div className="flex items-start gap-3">
                    {getEventTypeIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">
                          {event.type.replace('_', ' ')}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                      {Object.keys(event.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      {(hasHighRiskEvents || sessionRiskLevel === 'high' || isSessionExpiringSoon) && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Recommendations</h3>
          <div className="space-y-2">
            {hasHighRiskEvents && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">High-risk security events detected</p>
                  <p className="text-sm text-red-600">Review recent security events and consider changing your password.</p>
                </div>
              </div>
            )}
            {sessionRiskLevel === 'high' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">High session risk level</p>
                  <p className="text-sm text-red-600">Your session has been flagged as high-risk. Consider logging out and logging back in from a trusted device.</p>
                </div>
              </div>
            )}
            {isSessionExpiringSoon && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Session expiring soon</p>
                  <p className="text-sm text-yellow-600">Your session will expire soon. Save your work and refresh your session.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;