/**
 * pages.config.js — Red River OS Page Registry
 *
 * Auto-registers all pages from ./pages/ and wires them into the React Router
 * route table. The mainPage is the default landing experience — set to the
 * Red River OS Home page.
 *
 * NOTE: When adding a new app module page, add it here AND register it in
 * src/platform/appRegistry.js so the OS shell navigation reflects it.
 */

// ── OS-level pages ─────────────────────────────────────────────────────────
import RedRiverOSHome from './pages/RedRiverOSHome';
import MinistryOverview from './pages/MinistryOverview';

// ── MHIH app pages ─────────────────────────────────────────────────────────
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import AgentCenter from './pages/AgentCenter';
import AlertsCenter from './pages/AlertsCenter';
import AnalysisWorkbench from './pages/AnalysisWorkbench';
import ApprovalsInbox from './pages/ApprovalsInbox';
import Backtesting from './pages/Backtesting';
import Changelog from './pages/Changelog';
import ConflictWorkbench from './pages/ConflictWorkbench';
import Dashboard from './pages/Dashboard';
import DataAnalyst from './pages/DataAnalyst';
import DataGovernance from './pages/DataGovernance';
import DataQuality from './pages/DataQuality';
import DataRepository from './pages/DataRepository';
import DataSources from './pages/DataSources';
import EvidenceExplorer from './pages/EvidenceExplorer';
import EvidenceSnapshots from './pages/EvidenceSnapshots';
import GeoEquityMap from './pages/GeoEquityMap';
import HansardIntel from './pages/HansardIntel';
import Interventions from './pages/Interventions';
import KnowledgeAdmin from './pages/KnowledgeAdmin';
import MetricCatalog from './pages/MetricCatalog';
import MetricForge from './pages/MetricForge';
import Onboarding from './pages/Onboarding';
import PolicyHome from './pages/PolicyHome';
import PolicyLab from './pages/PolicyLab';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Recommendations from './pages/Recommendations';
import RedRiverOS from './pages/RedRiverOS';
import PolicyRequestForm from './pages/PolicyRequestForm';
import PolicyRequestTable from './pages/PolicyRequestTable';
import PolicyRequestCardView from './pages/PolicyRequestCardView';
import Reporting from './pages/Reporting';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Watchlists from './pages/Watchlists';
import Workflows from './pages/Workflows';

// ── Platform app module pages ──────────────────────────────────────────────
import PolicyStudio from './pages/PolicyStudio';
import HealthEquity from './pages/HealthEquity';
import ResearchEvaluation from './pages/ResearchEvaluation';
import ProvincialWellness from './pages/ProvincialWellness';
import ContractsReporting from './pages/ContractsReporting';
import PlanningKPI from './pages/PlanningKPI';

import __Layout from './Layout.jsx';


export const PAGES = {
    // ── OS home ──────────────────────────────────────────────────────
    "RedRiverOSHome": RedRiverOSHome,
    "MinistryOverview": MinistryOverview,

    // ── MHIH app ──────────────────────────────────────────────────────
    "AIInsights": AIInsights,
    "Admin": Admin,
    "AgentCenter": AgentCenter,
    "AlertsCenter": AlertsCenter,
    "AnalysisWorkbench": AnalysisWorkbench,
    "ApprovalsInbox": ApprovalsInbox,
    "Backtesting": Backtesting,
    "Changelog": Changelog,
    "ConflictWorkbench": ConflictWorkbench,
    "Dashboard": Dashboard,
    "DataAnalyst": DataAnalyst,
    "DataGovernance": DataGovernance,
    "DataQuality": DataQuality,
    "DataRepository": DataRepository,
    "DataSources": DataSources,
    "EvidenceExplorer": EvidenceExplorer,
    "EvidenceSnapshots": EvidenceSnapshots,
    "GeoEquityMap": GeoEquityMap,
    "HansardIntel": HansardIntel,
    "Interventions": Interventions,
    "KnowledgeAdmin": KnowledgeAdmin,
    "MetricCatalog": MetricCatalog,
    "MetricForge": MetricForge,
    "Onboarding": Onboarding,
    "PolicyHome": PolicyHome,
    "PolicyLab": PolicyLab,
    "PredictiveAnalytics": PredictiveAnalytics,
    "Recommendations": Recommendations,
    "RedRiverOS": RedRiverOS,
    "PolicyRequestForm": PolicyRequestForm,
    "PolicyRequestTable": PolicyRequestTable,
    "PolicyRequestCardView": PolicyRequestCardView,
    "Reporting": Reporting,
    "Settings": Settings,
    "Team": Team,
    "Watchlists": Watchlists,
    "Workflows": Workflows,

    // ── Platform app modules ──────────────────────────────────────────
    "PolicyStudio": PolicyStudio,
    "HealthEquity": HealthEquity,
    "ResearchEvaluation": ResearchEvaluation,
    "ProvincialWellness": ProvincialWellness,
    "ContractsReporting": ContractsReporting,
    "PlanningKPI": PlanningKPI,
}

export const pagesConfig = {
    // Red River OS Home is the platform landing experience.
    // Users who want to land directly in MHIH can navigate via the app switcher
    // or bookmark /Dashboard.
    mainPage: "RedRiverOSHome",
    Pages: PAGES,
    Layout: __Layout,
};