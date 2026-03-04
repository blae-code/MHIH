/**
 * pages.config.js - Page routing configuration
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 */
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import AgentCenter from './pages/AgentCenter';
import Alerts from './pages/Alerts';
import AlertsCenter from './pages/AlertsCenter';
import ApprovalsInbox from './pages/ApprovalsInbox';
import Backtesting from './pages/Backtesting';
import ConflictWorkbench from './pages/ConflictWorkbench';
import Dashboard from './pages/Dashboard';
import DataAnalyst from './pages/DataAnalyst';
import DataGovernance from './pages/DataGovernance';
import DataPrep from './pages/DataPrep';
import DataQuality from './pages/DataQuality';
import DataRepository from './pages/DataRepository';
import DataSources from './pages/DataSources';
import EvidenceExplorer from './pages/EvidenceExplorer';
import Export from './pages/Export';
import GeoEquityMap from './pages/GeoEquityMap';
import GeoMap from './pages/GeoMap';
import HansardIntel from './pages/HansardIntel';
import Interventions from './pages/Interventions';
import KnowledgeAdmin from './pages/KnowledgeAdmin';
import MyDataSources from './pages/MyDataSources';
import PolicyLab from './pages/PolicyLab';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Visualizations from './pages/Visualizations';
import Watchlists from './pages/Watchlists';
import Workflows from './pages/Workflows';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';

export const PAGES = {
  AIInsights,
  Admin,
  AgentCenter,
  Alerts,
  AlertsCenter,
  ApprovalsInbox,
  Backtesting,
  ConflictWorkbench,
  Dashboard,
  DataAnalyst,
  DataGovernance,
  DataPrep,
  DataQuality,
  DataRepository,
  DataSources,
  EvidenceExplorer,
  Export,
  GeoEquityMap,
  GeoMap,
  HansardIntel,
  Interventions,
  KnowledgeAdmin,
  MyDataSources,
  Onboarding,
  PolicyLab,
  PredictiveAnalytics,
  Recommendations,
  Reports,
  Settings,
  Team,
  Visualizations,
  Watchlists,
  Workflows,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout: __Layout,
};
