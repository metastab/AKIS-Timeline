import React from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  CircleDashed,
  Sparkles,
  Layers,
  AlertTriangle,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  totalTasks: number;
  totalDone: number;
  totalWorking: number;
  totalNotStarted: number;
  overallPercent: number;
  isLoading: boolean;
  isConfigured: boolean;
  projectId: string;
  user: User | null;
  onOpenLogin: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalTasks,
  totalDone,
  totalWorking,
  totalNotStarted,
  overallPercent,
  isLoading,
  isConfigured,
  projectId,
  user,
  onOpenLogin,
  onSignOut,
  onRefresh,
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand identity */}
        <div className="brand-group">
          <div className="brand-icon">
            <Sparkles size={20} className="brand-sparkle" />
            <Layers size={22} className="brand-layers" />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">AKIS</h1>
              <span className="brand-badge">Tracker</span>
            </div>
            <p className="brand-subtitle">Supabase CRUD Systems Checklist</p>
          </div>
        </div>

        {/* Global Progress bar & summary stats */}
        <div className="header-stats-container">
          <div className="stats-metric-row">
            <div className="stat-pill">
              <span className="stat-label">Total Features</span>
              <span className="stat-value">{totalTasks}</span>
            </div>
            <div className="stat-pill done-pill">
              <CheckCircle2 size={15} />
              <span className="stat-label">Done</span>
              <span className="stat-value">{totalDone}</span>
            </div>
            <div className="stat-pill working-pill">
              <Clock size={15} />
              <span className="stat-label">Working</span>
              <span className="stat-value">{totalWorking}</span>
            </div>
            <div className="stat-pill notstarted-pill">
              <CircleDashed size={15} />
              <span className="stat-label">Not Started</span>
              <span className="stat-value">{totalNotStarted}</span>
            </div>
          </div>

          <div className="global-progress-bar-wrap">
            <div className="progress-info">
              <span>Overall Project Completion</span>
              <span className="percent-text">{overallPercent}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* User Auth, Connection status and refresh */}
        <div className="header-actions">
          {/* User authentication pill */}
          {user ? (
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                <UserIcon size={14} />
              </div>
              <span className="user-email-text" title={user.email || 'Team Member'}>
                {user.email?.split('@')[0]}
              </span>
              <button
                onClick={onSignOut}
                className="user-logout-btn"
                title="Sign out of team access"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn-team-login"
              title="Sign in with member account to edit"
            >
              <LogIn size={15} />
              <span>Team Sign In</span>
            </button>
          )}

          <div
            className={`db-status-badge ${isConfigured ? 'is-connected' : 'is-unconfigured'}`}
            title={isConfigured ? `Connected to ${projectId}` : 'Credentials not configured'}
          >
            {isConfigured ? (
              <>
                <span className="db-status-dot animate-pulse-glow" />
                <Database size={15} className="db-icon" />
                <div className="db-text">
                  <span className="db-status-title">Supabase</span>
                  <span className="db-project-id">{projectId}</span>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
                <div className="db-text">
                  <span className="db-status-title" style={{ color: '#fbbf24' }}>Keys Required</span>
                  <span className="db-project-id">src/lib/supabase.ts</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading || !isConfigured}
            className={`refresh-btn ${isLoading ? 'is-loading' : ''}`}
            title="Refresh all systems from database"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin-slow' : ''} />
            <span className="btn-text">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
