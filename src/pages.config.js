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
import Dashboard from './pages/Dashboard';
import DataQuality from './pages/DataQuality';
import DataRepository from './pages/DataRepository';
import DataSources from './pages/DataSources';
import Export from './pages/Export';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Visualizations from './pages/Visualizations';
import MyDataSources from './pages/MyDataSources';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "Admin": Admin,
    "AgentCenter": AgentCenter,
    "Dashboard": Dashboard,
    "DataQuality": DataQuality,
    "DataRepository": DataRepository,
    "DataSources": DataSources,
    "Export": Export,
    "Settings": Settings,
    "Team": Team,
    "Visualizations": Visualizations,
    "MyDataSources": MyDataSources,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};