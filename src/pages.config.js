/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
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
import Onboarding from './pages/Onboarding';
import PolicyLab from './pages/PolicyLab';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Visualizations from './pages/Visualizations';
import Watchlists from './pages/Watchlists';
import Workflows from './pages/Workflows';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "Admin": Admin,
    "AgentCenter": AgentCenter,
    "Alerts": Alerts,
    "AlertsCenter": AlertsCenter,
    "ApprovalsInbox": ApprovalsInbox,
    "Backtesting": Backtesting,
    "ConflictWorkbench": ConflictWorkbench,
    "Dashboard": Dashboard,
    "DataAnalyst": DataAnalyst,
    "DataGovernance": DataGovernance,
    "DataPrep": DataPrep,
    "DataQuality": DataQuality,
    "DataRepository": DataRepository,
    "DataSources": DataSources,
    "EvidenceExplorer": EvidenceExplorer,
    "Export": Export,
    "GeoEquityMap": GeoEquityMap,
    "GeoMap": GeoMap,
    "HansardIntel": HansardIntel,
    "Interventions": Interventions,
    "KnowledgeAdmin": KnowledgeAdmin,
    "MyDataSources": MyDataSources,
    "Onboarding": Onboarding,
    "PolicyLab": PolicyLab,
    "PredictiveAnalytics": PredictiveAnalytics,
    "Recommendations": Recommendations,
    "Reports": Reports,
    "Settings": Settings,
    "Team": Team,
    "Visualizations": Visualizations,
    "Watchlists": Watchlists,
    "Workflows": Workflows,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};