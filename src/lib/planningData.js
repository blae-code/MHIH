/**
 * Planning & KPI — Domain Model & Mock Data
 *
 * Single source of truth for all Planning & KPI module data.
 * All page components and shared components consume from this file.
 *
 * Domain Types (JSDoc):
 * @typedef {Object} StrategicGoal
 * @typedef {Object} Objective
 * @typedef {Object} Plan
 * @typedef {Object} PlanDocument
 * @typedef {Object} Initiative
 * @typedef {Object} Milestone
 * @typedef {Object} ActionItem
 * @typedef {Object} KPI
 * @typedef {Object} KPIDataPoint
 * @typedef {Object} ScorecardEntry
 * @typedef {Object} ReportCycle
 * @typedef {Object} ReportDeliverable
 * @typedef {Object} Risk
 * @typedef {Object} MhihLink
 */

// ── Strategic Goals ─────────────────────────────────────────────────────────

export const GOALS = [
  {
    id: "G1",
    code: "G1",
    title: "Reduce Chronic Disease Burden",
    description:
      "Measurably reduce the prevalence of preventable chronic disease in Métis communities through targeted prevention programs, early intervention, and community-led wellness initiatives.",
    pillars: ["Prevention", "Community Wellness"],
    owner: "Director of Health Programs",
    cycle: "2024–2027",
    status: "on-track",
    color: "#40c4ff",
    linkedMetricIds: ["chronic-disease-prevalence", "diabetes-incidence-rate"],
    linkedPolicyIds: ["policy-1", "policy-3"],
    linkedMhihPages: ["MetricCatalog", "Dashboard"],
    objectives: [
      {
        id: "O1-1",
        goalId: "G1",
        title: "Reduce diabetes prevalence by 15% by 2027",
        description: "Through the Diabetes Prevention Pilot and community nutrition programming.",
        status: "on-track",
        owner: "Health Programs Lead",
        targetYear: 2027,
      },
      {
        id: "O1-2",
        goalId: "G1",
        title: "Expand chronic disease registry to all regions",
        description: "Integrate BC chronic disease registry data with MHIH.",
        status: "in-progress",
        owner: "MHIH Analytics",
        targetYear: 2026,
      },
    ],
  },
  {
    id: "G2",
    code: "G2",
    title: "Improve Culturally Safe Care Access",
    description:
      "Increase access to culturally safe, Métis-specific health services across BC by partnering with health authorities on training, navigation, and Métis-specific service delivery.",
    pillars: ["Health Equity", "Self-Determination"],
    owner: "Director of Health Equity",
    cycle: "2024–2027",
    status: "on-track",
    color: "#34d399",
    linkedMetricIds: ["cultural-safety-completion", "metis-patient-experience"],
    linkedPolicyIds: ["policy-2", "policy-4"],
    linkedMhihPages: ["EvidenceSnapshots", "MetricCatalog"],
    objectives: [
      {
        id: "O2-1",
        goalId: "G2",
        title: "Achieve 65% cultural safety training completion across BCs health authorities",
        description: "Coordinate training rollout with Interior Health, Fraser Health, and Northern Health.",
        status: "on-track",
        owner: "Health Equity Team",
        targetYear: 2026,
      },
      {
        id: "O2-2",
        goalId: "G2",
        title: "Establish Métis health navigator positions in 5 regions",
        description: "Working under LOU with BC Ministry of Health.",
        status: "at-risk",
        owner: "Director of Health Equity",
        targetYear: 2025,
      },
    ],
  },
  {
    id: "G3",
    code: "G3",
    title: "Advance Data Sovereignty",
    description:
      "Establish Métis ownership and governance over health data, including data sharing agreements with Métis governance provisions and development of MNBC data infrastructure.",
    pillars: ["Self-Determination", "Governance"],
    owner: "Director of Research & Data",
    cycle: "2024–2027",
    status: "at-risk",
    color: "#a78bfa",
    linkedMetricIds: ["data-agreements-count", "data-sovereignty-index"],
    linkedPolicyIds: ["policy-3", "policy-5"],
    linkedMhihPages: ["DataGovernance", "EvidenceSnapshots"],
    objectives: [
      {
        id: "O3-1",
        goalId: "G3",
        title: "Negotiate 8 data sharing agreements with Métis governance provisions",
        description: "Currently 4 of 8 agreements in place; 2 under negotiation.",
        status: "at-risk",
        owner: "Research & Data Lead",
        targetYear: 2026,
      },
      {
        id: "O3-2",
        goalId: "G3",
        title: "Launch MNBC Data Governance Framework",
        description: "Phase 2 of the Data Sovereignty Framework initiative.",
        status: "in-progress",
        owner: "Data Sovereignty Lead",
        targetYear: 2025,
      },
    ],
  },
  {
    id: "G4",
    code: "G4",
    title: "Strengthen Mental Health Supports",
    description:
      "Expand culturally grounded mental health and wellness programming across MNBC regions, with a focus on youth, elders, and crisis response.",
    pillars: ["Community Wellness", "Cultural Continuity"],
    owner: "Director of Wellness Programs",
    cycle: "2024–2027",
    status: "on-track",
    color: "#f472b6",
    linkedMetricIds: ["mental-health-service-interactions", "wellness-program-reach"],
    linkedPolicyIds: ["policy-1", "policy-2"],
    linkedMhihPages: ["Interventions", "Dashboard"],
    objectives: [
      {
        id: "O4-1",
        goalId: "G4",
        title: "Increase unique mental health service interactions to 1,200 annually",
        description: "Expand Métis Mental Health Strategy through Year 1 and 2 implementation.",
        status: "on-track",
        owner: "Wellness Programs Lead",
        targetYear: 2026,
      },
      {
        id: "O4-2",
        goalId: "G4",
        title: "Establish 3 Community Wellness Hubs",
        description: "Prince George hub in development; 2 additional hubs planned for 2025–26.",
        status: "in-progress",
        owner: "Community Programs",
        targetYear: 2026,
      },
    ],
  },
];

// ── Plans ───────────────────────────────────────────────────────────────────

export const PLANS = [
  {
    id: "plan-strategic-2024",
    title: "MNBC Health Strategic Plan 2024–2027",
    type: "strategic",
    cycle: "2024–2027",
    status: "active",
    owner: "Executive Director of Health",
    department: "Executive",
    approvedDate: "2024-03-15",
    description:
      "The three-year strategic plan for MNBC Health, setting out four primary goals, KPI targets, and cross-departmental delivery commitments aligned with the LOU with BC Ministry of Health.",
    goalIds: ["G1", "G2", "G3", "G4"],
    initiativeIds: ["init-1", "init-2", "init-3", "init-4", "init-5", "init-6", "init-7", "init-8"],
    documents: [
      { id: "doc-sp-1", title: "MNBC Health Strategic Plan 2024–2027 (Full)", type: "planning-document", lastUpdated: "2024-03-15", url: null },
      { id: "doc-sp-2", title: "Executive Summary", type: "appendix", lastUpdated: "2024-03-15", url: null },
      { id: "doc-sp-3", title: "KPI Framework Annex", type: "appendix", lastUpdated: "2024-04-01", url: null },
    ],
    reviewSchedule: "Annual review — March 2025, March 2026",
  },
  {
    id: "plan-ops-2024",
    title: "Health Programs Operational Workplan 2024–25",
    type: "operational",
    cycle: "2024–25",
    status: "active",
    owner: "Director of Health Programs",
    department: "Health Programs",
    approvedDate: "2024-04-10",
    description:
      "Annual operational workplan for the Health Programs department, translating strategic goals into quarterly deliverables for chronic disease, mental health, and wellness programming.",
    goalIds: ["G1", "G4"],
    initiativeIds: ["init-1", "init-4", "init-8"],
    documents: [
      { id: "doc-op-1", title: "Health Programs Workplan 2024–25", type: "workplan", lastUpdated: "2024-04-10", url: null },
      { id: "doc-op-2", title: "Q2 Progress Report", type: "appendix", lastUpdated: "2024-10-15", url: null },
    ],
    reviewSchedule: "Quarterly — July, October, January, April",
  },
  {
    id: "plan-ops-equity-2024",
    title: "Health Equity & LOU Implementation Workplan 2024–25",
    type: "operational",
    cycle: "2024–25",
    status: "active",
    owner: "Director of Health Equity",
    department: "Health Equity",
    approvedDate: "2024-04-15",
    description:
      "Workplan implementing the MNBC-BC MoH Letter of Understanding commitments for health equity, with a focus on cultural safety training, Métis navigator positions, and anti-racism work.",
    goalIds: ["G2"],
    initiativeIds: ["init-2", "init-6"],
    documents: [
      { id: "doc-eq-1", title: "Health Equity Workplan 2024–25", type: "workplan", lastUpdated: "2024-04-15", url: null },
      { id: "doc-eq-2", title: "LOU Implementation Checklist", type: "appendix", lastUpdated: "2024-06-01", url: null },
    ],
    reviewSchedule: "Quarterly — July, October, January, April",
  },
  {
    id: "plan-data-2024",
    title: "Data Sovereignty Action Plan 2024–25",
    type: "action-plan",
    cycle: "2024–25",
    status: "under-review",
    owner: "Director of Research & Data",
    department: "Research & Data",
    approvedDate: null,
    description:
      "Action plan for advancing Métis data sovereignty, covering the Data Governance Framework Phase 2, data sharing agreement negotiations, and the MHIH platform governance provisions.",
    goalIds: ["G3"],
    initiativeIds: ["init-3", "init-7"],
    documents: [
      { id: "doc-ds-1", title: "Data Sovereignty Action Plan 2024–25 (Draft v3)", type: "planning-document", lastUpdated: "2025-01-20", url: null },
      { id: "doc-ds-2", title: "Data Governance Framework Phase 2 — Draft", type: "appendix", lastUpdated: "2025-01-15", url: null },
    ],
    reviewSchedule: "Under Director review — pending approval",
  },
];

// ── Initiatives ──────────────────────────────────────────────────────────────

export const INITIATIVES = [
  {
    id: "init-1",
    planId: "plan-ops-2024",
    goalIds: ["G2"],
    title: "Cultural Safety Training Rollout — Interior Health",
    description:
      "Coordinate and monitor the rollout of Métis cultural safety training modules to Interior Health staff, including scheduling, completion tracking, and follow-up assessments.",
    lead: "Sarah Belleau",
    department: "Health Equity",
    status: "active",
    health: "green",
    startDate: "2024-05-01",
    endDate: "2025-03-31",
    budget: "$180,000",
    budgetSpent: "$124,000",
    riskLevel: "low",
    risks: [
      {
        id: "risk-1-1",
        initiativeId: "init-1",
        title: "IH scheduling delays due to staff turnover",
        description: "High staff turnover in IH clinical units may delay training cohort scheduling.",
        likelihood: "medium",
        impact: "medium",
        mitigationStrategy: "Maintain flexible scheduling windows; offer asynchronous modules as backup.",
        owner: "Sarah Belleau",
        status: "open",
      },
    ],
    milestones: [
      { id: "ms-1-1", initiativeId: "init-1", title: "Training modules finalised and approved", dueDate: "2024-06-30", completedDate: "2024-06-28", status: "complete", owner: "Sarah Belleau", notes: "All 4 modules approved by MNBC Elder Advisory." },
      { id: "ms-1-2", initiativeId: "init-1", title: "Pilot cohort (100 IH staff) complete training", dueDate: "2024-09-30", completedDate: "2024-09-25", status: "complete", owner: "Sarah Belleau", notes: "95 of 100 completed; 5 deferred to Q3." },
      { id: "ms-1-3", initiativeId: "init-1", title: "Phase 2 rollout — 500 additional staff", dueDate: "2024-12-31", completedDate: "2024-12-20", status: "complete", owner: "Training Coordinator", notes: "487 completed; remaining 13 rescheduled for Jan 2025." },
      { id: "ms-1-4", initiativeId: "init-1", title: "Phase 3 rollout — remaining IH staff", dueDate: "2025-03-31", completedDate: null, status: "in-progress", owner: "Training Coordinator", notes: "On schedule. 350 of 600 remaining staff enrolled." },
    ],
    actionItems: [
      { id: "ai-1-1", initiativeId: "init-1", milestoneId: "ms-1-4", title: "Confirm March cohort schedules with IH HR", owner: "Training Coordinator", dueDate: "2025-02-15", completedDate: "2025-02-14", status: "complete", priority: "high", notes: "" },
      { id: "ai-1-2", initiativeId: "init-1", milestoneId: "ms-1-4", title: "Submit Q3 completion report to Director", owner: "Sarah Belleau", dueDate: "2025-01-31", completedDate: null, status: "overdue", priority: "high", notes: "Awaiting final Q3 data from IH." },
      { id: "ai-1-3", initiativeId: "init-1", milestoneId: null, title: "Update MHIH cultural safety completion metric", owner: "MHIH Analytics", dueDate: "2025-02-28", completedDate: null, status: "in-progress", priority: "medium", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-cs-2024-q3", "snap-cs-pilot"],
    linkedPolicyIds: ["policy-2", "policy-4"],
    mhihLinks: [
      { page: "EvidenceSnapshots", label: "Cultural Safety Training Snapshots", description: "View training completion evidence snapshots in MHIH." },
      { page: "MetricCatalog", label: "Cultural Safety Metric", description: "Browse the cultural safety training completion metric family." },
    ],
    tags: ["health-equity", "interior-health", "training"],
  },
  {
    id: "init-2",
    planId: "plan-ops-equity-2024",
    goalIds: ["G4"],
    title: "Métis Mental Health Strategy — Year 1 Implementation",
    description:
      "Implement Year 1 commitments of the MNBC Métis Mental Health Strategy, including service navigator hiring, peer support expansion, and crisis line partnership.",
    lead: "Dr. James Swifthawk",
    department: "Wellness Programs",
    status: "active",
    health: "amber",
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    budget: "$320,000",
    budgetSpent: "$198,000",
    riskLevel: "medium",
    risks: [
      {
        id: "risk-2-1",
        initiativeId: "init-2",
        title: "Peer support worker recruitment challenges",
        description: "Limited pool of Métis-identified peer support workers with required certifications.",
        likelihood: "high",
        impact: "high",
        mitigationStrategy: "Expand recruitment to allied Indigenous communities; fund certification pathway for near-qualified candidates.",
        owner: "Dr. James Swifthawk",
        status: "open",
      },
      {
        id: "risk-2-2",
        initiativeId: "init-2",
        title: "Crisis line SLA negotiation delays",
        description: "Provincial crisis line renegotiation extending beyond expected timeline.",
        likelihood: "medium",
        impact: "medium",
        mitigationStrategy: "Maintain interim referral protocol while SLA is finalized.",
        owner: "Wellness Programs Lead",
        status: "mitigated",
      },
    ],
    milestones: [
      { id: "ms-2-1", initiativeId: "init-2", title: "Mental health navigator positions posted", dueDate: "2024-07-31", completedDate: "2024-07-25", status: "complete", owner: "HR", notes: "3 positions posted across Prince George, Kamloops, and Vancouver." },
      { id: "ms-2-2", initiativeId: "init-2", title: "Navigators hired and onboarded", dueDate: "2024-10-31", completedDate: "2024-11-15", status: "complete", owner: "Dr. James Swifthawk", notes: "2 of 3 hired on time; third position filled Nov 15 after extended competition." },
      { id: "ms-2-3", initiativeId: "init-2", title: "Peer support cohort (8 workers) trained", dueDate: "2025-01-31", completedDate: null, status: "at-risk", owner: "Wellness Programs Lead", notes: "Only 5 workers certified so far; 3 in training but at risk of missing deadline." },
      { id: "ms-2-4", initiativeId: "init-2", title: "Crisis line partnership SLA signed", dueDate: "2025-03-31", completedDate: null, status: "in-progress", owner: "Dr. James Swifthawk", notes: "Final draft under legal review." },
    ],
    actionItems: [
      { id: "ai-2-1", initiativeId: "init-2", milestoneId: "ms-2-3", title: "Identify alternative certification provider for 3 remaining workers", owner: "Wellness Programs Lead", dueDate: "2025-02-01", completedDate: null, status: "in-progress", priority: "high", notes: "" },
      { id: "ai-2-2", initiativeId: "init-2", milestoneId: "ms-2-4", title: "Review final SLA draft with legal counsel", owner: "Dr. James Swifthawk", dueDate: "2025-02-28", completedDate: null, status: "pending", priority: "medium", notes: "" },
      { id: "ai-2-3", initiativeId: "init-2", milestoneId: null, title: "Submit Year 1 progress report to MoH", owner: "Dr. James Swifthawk", dueDate: "2025-04-15", completedDate: null, status: "pending", priority: "high", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-mh-service-q3", "snap-mh-navigator"],
    linkedPolicyIds: ["policy-1"],
    mhihLinks: [
      { page: "Interventions", label: "Mental Health Interventions", description: "View MHIH mental health intervention tracking." },
      { page: "MetricCatalog", label: "Mental Health Metrics", description: "Browse mental health service interaction metrics." },
    ],
    tags: ["mental-health", "wellness", "year-1"],
  },
  {
    id: "init-3",
    planId: "plan-data-2024",
    goalIds: ["G3"],
    title: "Data Sovereignty Framework — Phase 2",
    description:
      "Complete Phase 2 of the MNBC Data Governance Framework, including data governance policy ratification, BC MoH data sharing agreement amendment, and pilot of the MNBC data access portal with Interior Health.",
    lead: "Rhonda Parenteau",
    department: "Research & Data",
    status: "active",
    health: "amber",
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    budget: "$210,000",
    budgetSpent: "$105,000",
    riskLevel: "high",
    risks: [
      {
        id: "risk-3-1",
        initiativeId: "init-3",
        title: "BC MoH agreement amendment delayed by legal review",
        description: "Provincial legal review of data sovereignty provisions taking longer than expected.",
        likelihood: "high",
        impact: "high",
        mitigationStrategy: "Engage MoH Deputy Minister directly; propose interim data access protocol as bridge measure.",
        owner: "Rhonda Parenteau",
        status: "open",
      },
    ],
    milestones: [
      { id: "ms-3-1", initiativeId: "init-3", title: "Complete draft data governance policy", dueDate: "2024-09-30", completedDate: "2024-09-28", status: "complete", owner: "Rhonda Parenteau", notes: "Policy drafted with input from 3 Elder knowledge keepers." },
      { id: "ms-3-2", initiativeId: "init-3", title: "MNBC Council review and ratification", dueDate: "2024-11-30", completedDate: "2024-12-05", status: "complete", owner: "Executive Director", notes: "Ratified with minor amendments at November Council meeting." },
      { id: "ms-3-3", initiativeId: "init-3", title: "Negotiate amendment to BC MoH data sharing agreement", dueDate: "2025-02-28", completedDate: null, status: "in-progress", owner: "Rhonda Parenteau", notes: "Draft amendment prepared; awaiting MoH legal review response." },
      { id: "ms-3-4", initiativeId: "init-3", title: "Pilot data access portal with Interior Health", dueDate: "2025-04-30", completedDate: null, status: "pending", owner: "MHIH Analytics", notes: "Dependent on milestone 3 completion." },
      { id: "ms-3-5", initiativeId: "init-3", title: "Full framework launch and communications", dueDate: "2025-06-30", completedDate: null, status: "pending", owner: "Rhonda Parenteau", notes: "" },
    ],
    actionItems: [
      { id: "ai-3-1", initiativeId: "init-3", milestoneId: "ms-3-3", title: "Follow up with MoH legal re: amendment timeline", owner: "Rhonda Parenteau", dueDate: "2025-02-10", completedDate: null, status: "overdue", priority: "high", notes: "No response received after 3 weeks." },
      { id: "ai-3-2", initiativeId: "init-3", milestoneId: "ms-3-3", title: "Draft interim data access protocol for bridge period", owner: "Research & Data Lead", dueDate: "2025-02-28", completedDate: null, status: "in-progress", priority: "medium", notes: "" },
      { id: "ai-3-3", initiativeId: "init-3", milestoneId: "ms-3-4", title: "Begin IH data access portal technical requirements", owner: "MHIH Analytics", dueDate: "2025-03-15", completedDate: null, status: "pending", priority: "medium", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-data-gov-v2", "snap-council-ratification"],
    linkedPolicyIds: ["policy-3", "policy-5"],
    mhihLinks: [
      { page: "DataGovernance", label: "MHIH Data Governance", description: "View MHIH data governance policies and audit logs." },
      { page: "EvidenceSnapshots", label: "Data Governance Snapshots", description: "Evidence snapshots for the framework ratification." },
    ],
    tags: ["data-sovereignty", "governance", "phase-2"],
  },
  {
    id: "init-4",
    planId: "plan-ops-2024",
    goalIds: ["G1"],
    title: "Diabetes Prevention Pilot — Northern Communities",
    description:
      "Implement a culturally adapted diabetes prevention program in 4 northern Métis communities, including nutrition coaching, physical activity support, and A1C screening.",
    lead: "Tanya Flett",
    department: "Health Programs",
    status: "active",
    health: "green",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    budget: "$145,000",
    budgetSpent: "$78,000",
    riskLevel: "low",
    risks: [
      {
        id: "risk-4-1",
        initiativeId: "init-4",
        title: "Weather and geography affecting community access",
        description: "Winter conditions in northern communities may delay in-person program delivery.",
        likelihood: "medium",
        impact: "low",
        mitigationStrategy: "Hybrid delivery model with telehealth option; pre-schedule sessions before freeze-up.",
        owner: "Tanya Flett",
        status: "mitigated",
      },
    ],
    milestones: [
      { id: "ms-4-1", initiativeId: "init-4", title: "Community advisory committees established (4 communities)", dueDate: "2024-09-30", completedDate: "2024-09-20", status: "complete", owner: "Tanya Flett", notes: "" },
      { id: "ms-4-2", initiativeId: "init-4", title: "Baseline A1C screening completed", dueDate: "2024-11-30", completedDate: "2024-11-28", status: "complete", owner: "Health Programs", notes: "238 participants screened." },
      { id: "ms-4-3", initiativeId: "init-4", title: "Nutrition program — session 1 complete in all communities", dueDate: "2025-01-31", completedDate: "2025-01-30", status: "complete", owner: "Nutrition Lead", notes: "" },
      { id: "ms-4-4", initiativeId: "init-4", title: "Mid-point evaluation and A1C re-screen", dueDate: "2025-04-30", completedDate: null, status: "pending", owner: "Tanya Flett", notes: "" },
    ],
    actionItems: [
      { id: "ai-4-1", initiativeId: "init-4", milestoneId: "ms-4-4", title: "Book lab capacity for April A1C screening", owner: "Health Programs", dueDate: "2025-03-01", completedDate: null, status: "pending", priority: "medium", notes: "" },
      { id: "ai-4-2", initiativeId: "init-4", milestoneId: null, title: "Compile Q3 program attendance data", owner: "Tanya Flett", dueDate: "2025-01-31", completedDate: "2025-02-01", status: "complete", priority: "low", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-diabetes-baseline", "snap-diabetes-q2"],
    linkedPolicyIds: ["policy-1"],
    mhihLinks: [
      { page: "MetricCatalog", label: "Diabetes Prevention Metrics", description: "View diabetes incidence and A1C tracking metrics." },
      { page: "Dashboard", label: "Northern Communities Dashboard", description: "MHIH regional health dashboard for Northern BC." },
    ],
    tags: ["chronic-disease", "diabetes", "northern-communities"],
  },
  {
    id: "init-5",
    planId: "plan-strategic-2024",
    goalIds: ["G3", "G1"],
    title: "MNBC Health Equity Index Development",
    description:
      "Develop a composite Health Equity Index for Métis communities in BC, drawing on MHIH metrics across chronic disease, mental health, cultural safety, and social determinants.",
    lead: "Dr. Lena Morin",
    department: "Research & Data",
    status: "active",
    health: "green",
    startDate: "2024-09-01",
    endDate: "2025-08-31",
    budget: "$95,000",
    budgetSpent: "$42,000",
    riskLevel: "low",
    risks: [],
    milestones: [
      { id: "ms-5-1", initiativeId: "init-5", title: "Literature review and framework scoping complete", dueDate: "2024-11-30", completedDate: "2024-11-25", status: "complete", owner: "Dr. Lena Morin", notes: "" },
      { id: "ms-5-2", initiativeId: "init-5", title: "Index methodology approved by MNBC Research Committee", dueDate: "2025-01-31", completedDate: "2025-01-29", status: "complete", owner: "Research Committee", notes: "" },
      { id: "ms-5-3", initiativeId: "init-5", title: "MHIH data integration for index calculation complete", dueDate: "2025-04-30", completedDate: null, status: "in-progress", owner: "MHIH Analytics", notes: "Integration scripts drafted; QA in progress." },
      { id: "ms-5-4", initiativeId: "init-5", title: "Pilot index report for 3 regions published", dueDate: "2025-07-31", completedDate: null, status: "pending", owner: "Dr. Lena Morin", notes: "" },
    ],
    actionItems: [
      { id: "ai-5-1", initiativeId: "init-5", milestoneId: "ms-5-3", title: "Complete MHIH metric QA for index calculation", owner: "MHIH Analytics", dueDate: "2025-03-31", completedDate: null, status: "in-progress", priority: "high", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-equity-index-methodology"],
    linkedPolicyIds: ["policy-3"],
    mhihLinks: [
      { page: "MetricCatalog", label: "Equity Index Metrics", description: "View the metric components of the Health Equity Index." },
      { page: "EvidenceSnapshots", label: "Index Methodology Snapshot", description: "Evidence snapshot for the approved methodology." },
    ],
    tags: ["research", "equity-index", "metrics"],
  },
  {
    id: "init-6",
    planId: "plan-ops-equity-2024",
    goalIds: ["G2"],
    title: "BC MoH LOU Implementation — Health Authority Workplans",
    description:
      "Coordinate MNBC's participation in Health Authority workplans arising from the MNBC-BC MoH Letter of Understanding, including joint oversight tables and deliverable tracking.",
    lead: "Marcus Chartrand",
    department: "Health Equity",
    status: "active",
    health: "amber",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    budget: "$75,000",
    budgetSpent: "$61,000",
    riskLevel: "medium",
    risks: [
      {
        id: "risk-6-1",
        initiativeId: "init-6",
        title: "HA workplan submission quality inconsistent",
        description: "Some health authorities submitting workplans without adequate Métis-specific metrics.",
        likelihood: "medium",
        impact: "high",
        mitigationStrategy: "Provide HA workplan template with mandatory Métis outcome indicators; offer technical support sessions.",
        owner: "Marcus Chartrand",
        status: "open",
      },
    ],
    milestones: [
      { id: "ms-6-1", initiativeId: "init-6", title: "HA workplan templates distributed", dueDate: "2024-05-31", completedDate: "2024-05-28", status: "complete", owner: "Marcus Chartrand", notes: "" },
      { id: "ms-6-2", initiativeId: "init-6", title: "Q1 HA workplans received and reviewed", dueDate: "2024-07-31", completedDate: "2024-08-05", status: "complete", owner: "Marcus Chartrand", notes: "5 of 6 HAs submitted on time; Northern Health delayed." },
      { id: "ms-6-3", initiativeId: "init-6", title: "Mid-year LOU oversight table convened", dueDate: "2024-10-31", completedDate: "2024-11-02", status: "complete", owner: "Director of Health Equity", notes: "" },
      { id: "ms-6-4", initiativeId: "init-6", title: "Year-end LOU report submitted to MoH", dueDate: "2025-03-31", completedDate: null, status: "in-progress", owner: "Marcus Chartrand", notes: "Data collection in progress; final narrative pending." },
    ],
    actionItems: [
      { id: "ai-6-1", initiativeId: "init-6", milestoneId: "ms-6-4", title: "Collect Q3 HA progress data", owner: "Marcus Chartrand", dueDate: "2025-02-15", completedDate: null, status: "in-progress", priority: "high", notes: "" },
      { id: "ai-6-2", initiativeId: "init-6", milestoneId: "ms-6-4", title: "Draft executive narrative for LOU report", owner: "Director of Health Equity", dueDate: "2025-03-15", completedDate: null, status: "pending", priority: "high", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-lou-mid-year"],
    linkedPolicyIds: ["policy-2", "policy-4"],
    mhihLinks: [
      { page: "EvidenceSnapshots", label: "LOU Progress Snapshots", description: "View mid-year and annual LOU evidence snapshots." },
    ],
    tags: ["LOU", "health-authority", "MoH"],
  },
  {
    id: "init-7",
    planId: "plan-data-2024",
    goalIds: ["G3", "G1"],
    title: "Chronic Disease Registry Integration",
    description:
      "Integrate BC provincial chronic disease registry data into the MHIH platform with Métis-identifying provisions, enabling population-level chronic disease tracking for MNBC.",
    lead: "Rhonda Parenteau",
    department: "Research & Data",
    status: "planning",
    health: "green",
    startDate: "2025-03-01",
    endDate: "2025-12-31",
    budget: "$165,000",
    budgetSpent: "$0",
    riskLevel: "medium",
    risks: [
      {
        id: "risk-7-1",
        initiativeId: "init-7",
        title: "BC registry Métis self-identification rate insufficient",
        description: "Current Métis self-identification rate in BC registry may be too low for reliable population analytics.",
        likelihood: "high",
        impact: "medium",
        mitigationStrategy: "Negotiate supplementary linkage approach with PHAC; implement community-based ID enhancement program.",
        owner: "Dr. Lena Morin",
        status: "open",
      },
    ],
    milestones: [
      { id: "ms-7-1", initiativeId: "init-7", title: "Data access agreement with BCCDC signed", dueDate: "2025-04-30", completedDate: null, status: "pending", owner: "Rhonda Parenteau", notes: "" },
      { id: "ms-7-2", initiativeId: "init-7", title: "Data schema mapping and transformation complete", dueDate: "2025-07-31", completedDate: null, status: "pending", owner: "MHIH Analytics", notes: "" },
      { id: "ms-7-3", initiativeId: "init-7", title: "MHIH integration live in staging environment", dueDate: "2025-10-31", completedDate: null, status: "pending", owner: "MHIH Analytics", notes: "" },
      { id: "ms-7-4", initiativeId: "init-7", title: "Production launch and QA sign-off", dueDate: "2025-12-31", completedDate: null, status: "pending", owner: "Rhonda Parenteau", notes: "" },
    ],
    actionItems: [
      { id: "ai-7-1", initiativeId: "init-7", milestoneId: "ms-7-1", title: "Draft data access agreement with BCCDC", owner: "Rhonda Parenteau", dueDate: "2025-03-31", completedDate: null, status: "pending", priority: "medium", notes: "" },
    ],
    linkedEvidenceSnapshotIds: [],
    linkedPolicyIds: ["policy-3"],
    mhihLinks: [
      { page: "DataGovernance", label: "Registry Integration Governance", description: "View MHIH data governance for the registry integration." },
      { page: "MetricCatalog", label: "Chronic Disease Metrics", description: "View existing chronic disease metrics in MHIH." },
    ],
    tags: ["data", "registry", "chronic-disease"],
  },
  {
    id: "init-8",
    planId: "plan-ops-2024",
    goalIds: ["G4"],
    title: "Community Wellness Hub — Prince George",
    description:
      "Establish a Community Wellness Hub in Prince George offering integrated mental health, cultural wellness, and social support services for urban Métis community members.",
    lead: "Elder Rose Dumont (Advisor), Colette Swain (Lead)",
    department: "Wellness Programs",
    status: "active",
    health: "green",
    startDate: "2024-10-01",
    endDate: "2025-09-30",
    budget: "$280,000",
    budgetSpent: "$89,000",
    riskLevel: "low",
    risks: [],
    milestones: [
      { id: "ms-8-1", initiativeId: "init-8", title: "Community engagement and site selection complete", dueDate: "2024-11-30", completedDate: "2024-11-25", status: "complete", owner: "Colette Swain", notes: "Site selected: 1590 3rd Ave N, Prince George." },
      { id: "ms-8-2", initiativeId: "init-8", title: "Hub design and programming plan approved", dueDate: "2025-01-31", completedDate: "2025-01-28", status: "complete", owner: "Elder Rose Dumont", notes: "Approved by Elder advisory and wellness committee." },
      { id: "ms-8-3", initiativeId: "init-8", title: "Hub fit-out and furnishing complete", dueDate: "2025-04-30", completedDate: null, status: "in-progress", owner: "Colette Swain", notes: "Construction started March 3. On schedule." },
      { id: "ms-8-4", initiativeId: "init-8", title: "Soft launch with inaugural programming week", dueDate: "2025-06-15", completedDate: null, status: "pending", owner: "Colette Swain", notes: "" },
    ],
    actionItems: [
      { id: "ai-8-1", initiativeId: "init-8", milestoneId: "ms-8-3", title: "Confirm contractor schedule for remaining fit-out work", owner: "Colette Swain", dueDate: "2025-03-10", completedDate: null, status: "in-progress", priority: "medium", notes: "" },
      { id: "ai-8-2", initiativeId: "init-8", milestoneId: "ms-8-4", title: "Design inaugural programming schedule", owner: "Elder Rose Dumont", dueDate: "2025-05-01", completedDate: null, status: "pending", priority: "medium", notes: "" },
    ],
    linkedEvidenceSnapshotIds: ["snap-wellness-hub-site"],
    linkedPolicyIds: ["policy-1", "policy-2"],
    mhihLinks: [
      { page: "Interventions", label: "Wellness Hub Interventions", description: "View MHIH wellness intervention programming." },
    ],
    tags: ["wellness-hub", "prince-george", "urban-métis"],
  },
];

// ── KPIs ────────────────────────────────────────────────────────────────────

export const KPIS = [
  {
    id: "kpi-1",
    goalIds: ["G1"],
    title: "Chronic Disease Prevalence Rate — Métis BC",
    category: "Health Outcomes",
    unit: "%",
    direction: "lower_is_better",
    baseline: "24.3",
    baselineYear: 2023,
    target: "21.0",
    targetYear: 2027,
    current: "23.1",
    currentYear: 2024,
    progressPct: 45,
    trend: "improving",
    status: "on-track",
    owner: "Director of Health Programs",
    reportingCadence: "annual",
    linkedMetricId: "chronic-disease-prevalence",
    dataSource: "MHIH / BC Chronic Disease Registry",
    notes: "Baseline from 2023 MNBC Health Survey.",
    history: [
      { period: "2023", value: "24.3", notes: "Baseline year" },
      { period: "2024", value: "23.1", notes: "Annual update" },
    ],
  },
  {
    id: "kpi-2",
    goalIds: ["G1"],
    title: "Diabetes Incidence Rate — Métis Northern BC",
    category: "Chronic Disease",
    unit: "per 1,000",
    direction: "lower_is_better",
    baseline: "18.4",
    baselineYear: 2023,
    target: "15.6",
    targetYear: 2027,
    current: "17.8",
    currentYear: 2024,
    progressPct: 21,
    trend: "improving",
    status: "on-track",
    owner: "Health Programs Lead",
    reportingCadence: "annual",
    linkedMetricId: "diabetes-incidence-rate",
    dataSource: "Diabetes Prevention Pilot data / MHIH",
    notes: "",
    history: [
      { period: "2023", value: "18.4", notes: "Baseline" },
      { period: "Q1 2024-25", value: "18.1", notes: "" },
      { period: "Q2 2024-25", value: "17.9", notes: "" },
      { period: "Q3 2024-25", value: "17.8", notes: "" },
    ],
  },
  {
    id: "kpi-3",
    goalIds: ["G2"],
    title: "Cultural Safety Training Completion — HA Staff",
    category: "Cultural Safety",
    unit: "%",
    direction: "higher_is_better",
    baseline: "12",
    baselineYear: 2023,
    target: "65",
    targetYear: 2026,
    current: "38",
    currentYear: 2024,
    progressPct: 49,
    trend: "improving",
    status: "on-track",
    owner: "Director of Health Equity",
    reportingCadence: "quarterly",
    linkedMetricId: "cultural-safety-completion",
    dataSource: "Interior Health HR / MNBC training records",
    notes: "Tracking IH as lead HA; full BC rollout in 2025.",
    history: [
      { period: "Q4 2023-24", value: "12", notes: "Baseline" },
      { period: "Q1 2024-25", value: "18", notes: "Pilot cohort complete" },
      { period: "Q2 2024-25", value: "28", notes: "Phase 2 cohort 1 complete" },
      { period: "Q3 2024-25", value: "38", notes: "Phase 2 cohort 2 complete" },
    ],
  },
  {
    id: "kpi-4",
    goalIds: ["G2"],
    title: "Métis Patient Experience Score — BC Health Authorities",
    category: "Cultural Safety",
    unit: "/10",
    direction: "higher_is_better",
    baseline: "5.8",
    baselineYear: 2023,
    target: "7.5",
    targetYear: 2027,
    current: "6.3",
    currentYear: 2024,
    progressPct: 29,
    trend: "improving",
    status: "on-track",
    owner: "Director of Health Equity",
    reportingCadence: "annual",
    linkedMetricId: "metis-patient-experience",
    dataSource: "MNBC Patient Experience Survey",
    notes: "",
    history: [
      { period: "2023", value: "5.8", notes: "Baseline" },
      { period: "2024", value: "6.3", notes: "" },
    ],
  },
  {
    id: "kpi-5",
    goalIds: ["G3"],
    title: "Data Sharing Agreements with Métis Governance Provisions",
    category: "Data Sovereignty",
    unit: "count",
    direction: "higher_is_better",
    baseline: "2",
    baselineYear: 2023,
    target: "8",
    targetYear: 2026,
    current: "4",
    currentYear: 2025,
    progressPct: 33,
    trend: "stable",
    status: "at-risk",
    owner: "Director of Research & Data",
    reportingCadence: "biannual",
    linkedMetricId: "data-agreements-count",
    dataSource: "MNBC Legal / Research & Data",
    notes: "Progress stalled on provincial data sharing amendment.",
    history: [
      { period: "2023", value: "2", notes: "Baseline" },
      { period: "2024-H1", value: "3", notes: "" },
      { period: "2024-H2", value: "4", notes: "" },
    ],
  },
  {
    id: "kpi-6",
    goalIds: ["G3"],
    title: "MHIH Data Governance Compliance Score",
    category: "Data Sovereignty",
    unit: "%",
    direction: "higher_is_better",
    baseline: "41",
    baselineYear: 2023,
    target: "90",
    targetYear: 2026,
    current: "67",
    currentYear: 2025,
    progressPct: 53,
    trend: "improving",
    status: "on-track",
    owner: "Research & Data Lead",
    reportingCadence: "quarterly",
    linkedMetricId: "data-sovereignty-index",
    dataSource: "MHIH Data Governance Module",
    notes: "",
    history: [
      { period: "Q4 2023-24", value: "41", notes: "Baseline" },
      { period: "Q1 2024-25", value: "52", notes: "" },
      { period: "Q2 2024-25", value: "60", notes: "" },
      { period: "Q3 2024-25", value: "67", notes: "" },
    ],
  },
  {
    id: "kpi-7",
    goalIds: ["G4"],
    title: "Unique Mental Health Service Interactions (annual)",
    category: "Mental Health",
    unit: "count",
    direction: "higher_is_better",
    baseline: "680",
    baselineYear: 2023,
    target: "1200",
    targetYear: 2026,
    current: "890",
    currentYear: 2024,
    progressPct: 40,
    trend: "improving",
    status: "on-track",
    owner: "Director of Wellness Programs",
    reportingCadence: "quarterly",
    linkedMetricId: "mental-health-service-interactions",
    dataSource: "MNBC Wellness Programs records / MHIH",
    notes: "",
    history: [
      { period: "Q4 2023-24", value: "680", notes: "Baseline (annual)" },
      { period: "Q1 2024-25", value: "195", notes: "" },
      { period: "Q2 2024-25", value: "218", notes: "" },
      { period: "Q3 2024-25", value: "231", notes: "" },
    ],
  },
  {
    id: "kpi-8",
    goalIds: ["G4"],
    title: "Community Wellness Program Reach — Unique Participants",
    category: "Wellness",
    unit: "count",
    direction: "higher_is_better",
    baseline: "1240",
    baselineYear: 2023,
    target: "2500",
    targetYear: 2027,
    current: "1680",
    currentYear: 2024,
    progressPct: 35,
    trend: "improving",
    status: "on-track",
    owner: "Wellness Programs Lead",
    reportingCadence: "annual",
    linkedMetricId: "wellness-program-reach",
    dataSource: "MNBC Wellness Programs records",
    notes: "",
    history: [
      { period: "2023", value: "1240", notes: "Baseline" },
      { period: "2024", value: "1680", notes: "" },
    ],
  },
  {
    id: "kpi-9",
    goalIds: ["G1", "G2"],
    title: "Preventive Screening Rate — Métis Adults BC",
    category: "Prevention",
    unit: "%",
    direction: "higher_is_better",
    baseline: "34",
    baselineYear: 2023,
    target: "55",
    targetYear: 2027,
    current: "39",
    currentYear: 2024,
    progressPct: 24,
    trend: "improving",
    status: "on-track",
    owner: "Director of Health Programs",
    reportingCadence: "annual",
    linkedMetricId: null,
    dataSource: "MNBC Health Survey / MHIH",
    notes: "Composite: colorectal, breast, cervical, diabetes screening.",
    history: [
      { period: "2023", value: "34", notes: "Baseline" },
      { period: "2024", value: "39", notes: "" },
    ],
  },
  {
    id: "kpi-10",
    goalIds: ["G2"],
    title: "Métis Health Navigator Positions Established",
    category: "Access",
    unit: "count",
    direction: "higher_is_better",
    baseline: "0",
    baselineYear: 2023,
    target: "5",
    targetYear: 2025,
    current: "2",
    currentYear: 2025,
    progressPct: 40,
    trend: "stable",
    status: "at-risk",
    owner: "Director of Health Equity",
    reportingCadence: "quarterly",
    linkedMetricId: null,
    dataSource: "MNBC HR / Health Equity",
    notes: "Third position offer extended; 2 remaining positions pending MoH LOU amendment.",
    history: [
      { period: "Q1 2024-25", value: "0", notes: "" },
      { period: "Q2 2024-25", value: "2", notes: "2 navigators hired" },
      { period: "Q3 2024-25", value: "2", notes: "No change; third hire delayed" },
    ],
  },
  {
    id: "kpi-11",
    goalIds: ["G4"],
    title: "Youth Mental Health Crisis Referrals Resolved Within 72hrs",
    category: "Mental Health",
    unit: "%",
    direction: "higher_is_better",
    baseline: "52",
    baselineYear: 2023,
    target: "80",
    targetYear: 2026,
    current: "61",
    currentYear: 2025,
    progressPct: 32,
    trend: "improving",
    status: "on-track",
    owner: "Wellness Programs Lead",
    reportingCadence: "quarterly",
    linkedMetricId: null,
    dataSource: "MNBC Wellness / Crisis response logs",
    notes: "",
    history: [
      { period: "Q4 2023-24", value: "52", notes: "Baseline" },
      { period: "Q1 2024-25", value: "55", notes: "" },
      { period: "Q2 2024-25", value: "58", notes: "" },
      { period: "Q3 2024-25", value: "61", notes: "" },
    ],
  },
  {
    id: "kpi-12",
    goalIds: ["G3"],
    title: "Métis Self-Identification Rate — BC Health Systems",
    category: "Data Sovereignty",
    unit: "%",
    direction: "higher_is_better",
    baseline: "28",
    baselineYear: 2023,
    target: "60",
    targetYear: 2027,
    current: "31",
    currentYear: 2024,
    progressPct: 9,
    trend: "stable",
    status: "off-track",
    owner: "Director of Research & Data",
    reportingCadence: "annual",
    linkedMetricId: null,
    dataSource: "BC Health System ID data / MNBC survey",
    notes: "Slow progress. Requires broader provincial identification initiative.",
    history: [
      { period: "2023", value: "28", notes: "Baseline" },
      { period: "2024", value: "31", notes: "" },
    ],
  },
];

// ── Scorecard Entries ────────────────────────────────────────────────────────

export const SCORECARD_ENTRIES = [
  { id: "se-1", kpiId: "kpi-1", goalId: "G1", period: "Q2 2024-25", value: "23.4", narrativeExplanation: "Chronic disease prevalence continues a modest downward trend. Diabetes Prevention Pilot is showing early positive signals. Annual update expected in March 2025.", preparedBy: "Analytics Team", approvedBy: "Director of Health Programs", status: "approved", submittedAt: "2024-10-18" },
  { id: "se-2", kpiId: "kpi-2", goalId: "G1", period: "Q2 2024-25", value: "17.9", narrativeExplanation: "Diabetes incidence in northern communities showing improvement. Pilot cohort A1C screening data ingested. Mid-point evaluation due April 2025.", preparedBy: "Analytics Team", approvedBy: "Director of Health Programs", status: "approved", submittedAt: "2024-10-18" },
  { id: "se-3", kpiId: "kpi-3", goalId: "G2", period: "Q2 2024-25", value: "28", narrativeExplanation: "Cultural safety training Phase 2 cohort 1 complete. 28% of IH staff trained as of October 2024. Phase 2 cohort 2 scheduled for November.", preparedBy: "Health Equity Team", approvedBy: "Director of Health Equity", status: "approved", submittedAt: "2024-10-20" },
  { id: "se-4", kpiId: "kpi-4", goalId: "G2", period: "Q2 2024-25", value: "6.1", narrativeExplanation: "Patient experience survey conducted in summer 2024. Interim score 6.1/10; full annual score released in March 2025.", preparedBy: "Health Equity Team", approvedBy: null, status: "submitted", submittedAt: "2024-10-20" },
  { id: "se-5", kpiId: "kpi-5", goalId: "G3", period: "Q2 2024-25", value: "3", narrativeExplanation: "Third agreement signed with Northern Health in September. MoH amendment for provincial data sharing agreement in progress; expected Q4.", preparedBy: "Research & Data", approvedBy: "Director of Research & Data", status: "approved", submittedAt: "2024-10-22" },
  { id: "se-6", kpiId: "kpi-6", goalId: "G3", period: "Q2 2024-25", value: "60", narrativeExplanation: "MHIH data governance compliance improved following Phase 2 policy ratification. Audit logs and consent tracking modules now live.", preparedBy: "Research & Data", approvedBy: "Director of Research & Data", status: "approved", submittedAt: "2024-10-22" },
  { id: "se-7", kpiId: "kpi-7", goalId: "G4", period: "Q2 2024-25", value: "218", narrativeExplanation: "218 unique service interactions in Q2. Year-to-date total 413, on track for annual target. Mental health navigator positions now active in 2 regions.", preparedBy: "Wellness Programs", approvedBy: "Director of Wellness Programs", status: "approved", submittedAt: "2024-10-21" },
  { id: "se-8", kpiId: "kpi-8", goalId: "G4", period: "Q2 2024-25", value: "1480", narrativeExplanation: "YTD wellness program participants at 1,480. Community Wellness Hub Prince George in planning; expected to significantly increase reach in 2025-26.", preparedBy: "Wellness Programs", approvedBy: "Director of Wellness Programs", status: "approved", submittedAt: "2024-10-21" },
  { id: "se-9", kpiId: "kpi-9", goalId: "G1", period: "Q2 2024-25", value: "37", narrativeExplanation: "Preventive screening rate improving. Diabetes screening in northern communities driving most of the gain. Annual figure expected March 2025.", preparedBy: "Analytics Team", approvedBy: "Director of Health Programs", status: "approved", submittedAt: "2024-10-18" },
  { id: "se-10", kpiId: "kpi-10", goalId: "G2", period: "Q2 2024-25", value: "2", narrativeExplanation: "2 navigator positions established as of Q2. Third position offer extended but not yet accepted. Positions 4 and 5 pending LOU amendment.", preparedBy: "Health Equity Team", approvedBy: "Director of Health Equity", status: "approved", submittedAt: "2024-10-20" },
  { id: "se-11", kpiId: "kpi-11", goalId: "G4", period: "Q2 2024-25", value: "58", narrativeExplanation: "Youth crisis referral resolution improving. Peer support expansion expected to further improve this metric in Q3–Q4.", preparedBy: "Wellness Programs", approvedBy: "Director of Wellness Programs", status: "approved", submittedAt: "2024-10-21" },
  { id: "se-12", kpiId: "kpi-12", goalId: "G3", period: "Q2 2024-25", value: "30", narrativeExplanation: "Self-identification rate progress is slow. Identification enhancement pilot proposed for 2025-26. Annual figure expected March 2025.", preparedBy: "Research & Data", approvedBy: "Director of Research & Data", status: "approved", submittedAt: "2024-10-22" },
];

// ── Report Cycles ────────────────────────────────────────────────────────────

export const REPORT_CYCLES = [
  {
    id: "rc-q1-2024",
    title: "Q1 2024–25 Progress Report",
    type: "quarterly",
    period: "Q1 2024–25",
    status: "published",
    openDate: "2024-07-01",
    dueDate: "2024-07-31",
    publishedDate: "2024-08-05",
    assignedTo: ["Analytics Team", "Health Equity", "Wellness Programs", "Research & Data"],
    linkedKpiIds: ["kpi-3", "kpi-7", "kpi-10", "kpi-11"],
    linkedInitiativeIds: ["init-1", "init-2", "init-4"],
    narrativeRequired: true,
    deliverables: [
      { id: "rd-q1-1", title: "KPI Data Update — Q1", type: "data-table", status: "complete", owner: "Analytics Team", dueDate: "2024-07-25" },
      { id: "rd-q1-2", title: "Executive Narrative Summary", type: "executive-summary", status: "complete", owner: "Director of Health Programs", dueDate: "2024-07-28" },
      { id: "rd-q1-3", title: "Health Equity Dashboard Export", type: "dashboard-export", status: "complete", owner: "Analytics Team", dueDate: "2024-07-31" },
    ],
    linkedContractIds: ["ca-moh-2024"],
  },
  {
    id: "rc-q2-2024",
    title: "Q2 2024–25 Progress Report",
    type: "quarterly",
    period: "Q2 2024–25",
    status: "published",
    openDate: "2024-10-01",
    dueDate: "2024-10-31",
    publishedDate: "2024-11-08",
    assignedTo: ["Analytics Team", "Health Equity", "Wellness Programs", "Research & Data"],
    linkedKpiIds: ["kpi-1", "kpi-2", "kpi-3", "kpi-4", "kpi-5", "kpi-6", "kpi-7", "kpi-8", "kpi-9", "kpi-10", "kpi-11", "kpi-12"],
    linkedInitiativeIds: ["init-1", "init-2", "init-3", "init-4", "init-5", "init-6"],
    narrativeRequired: true,
    deliverables: [
      { id: "rd-q2-1", title: "Full KPI Scorecard — Q2", type: "data-table", status: "complete", owner: "Analytics Team", dueDate: "2024-10-25" },
      { id: "rd-q2-2", title: "Executive Narrative — Q2", type: "executive-summary", status: "complete", owner: "Executive Director", dueDate: "2024-10-28" },
      { id: "rd-q2-3", title: "Initiative Progress Narratives", type: "narrative", status: "complete", owner: "Program Directors", dueDate: "2024-10-31" },
    ],
    linkedContractIds: ["ca-moh-2024"],
  },
  {
    id: "rc-q3-2024",
    title: "Q3 2024–25 Progress Report",
    type: "quarterly",
    period: "Q3 2024–25",
    status: "open",
    openDate: "2025-01-01",
    dueDate: "2025-01-31",
    publishedDate: null,
    assignedTo: ["Analytics Team", "Health Equity", "Wellness Programs", "Research & Data"],
    linkedKpiIds: ["kpi-3", "kpi-5", "kpi-6", "kpi-7", "kpi-10", "kpi-11"],
    linkedInitiativeIds: ["init-1", "init-2", "init-3", "init-6"],
    narrativeRequired: true,
    deliverables: [
      { id: "rd-q3-1", title: "Q3 KPI Data Update", type: "data-table", status: "in-progress", owner: "Analytics Team", dueDate: "2025-01-24" },
      { id: "rd-q3-2", title: "Q3 Executive Narrative", type: "executive-summary", status: "pending", owner: "Executive Director", dueDate: "2025-01-28" },
      { id: "rd-q3-3", title: "Initiative Progress Narratives — Q3", type: "narrative", status: "in-progress", owner: "Program Directors", dueDate: "2025-01-31" },
    ],
    linkedContractIds: ["ca-moh-2024"],
  },
  {
    id: "rc-q4-2024",
    title: "Q4 2024–25 Annual Report",
    type: "semi-annual",
    period: "Q4 2024–25 (Annual)",
    status: "upcoming",
    openDate: "2025-04-01",
    dueDate: "2025-04-30",
    publishedDate: null,
    assignedTo: ["Analytics Team", "Health Equity", "Wellness Programs", "Research & Data", "Executive"],
    linkedKpiIds: ["kpi-1", "kpi-2", "kpi-3", "kpi-4", "kpi-5", "kpi-6", "kpi-7", "kpi-8", "kpi-9", "kpi-10", "kpi-11", "kpi-12"],
    linkedInitiativeIds: ["init-1", "init-2", "init-3", "init-4", "init-5", "init-6", "init-7", "init-8"],
    narrativeRequired: true,
    deliverables: [
      { id: "rd-q4-1", title: "Annual KPI Scorecard", type: "data-table", status: "pending", owner: "Analytics Team", dueDate: "2025-04-20" },
      { id: "rd-q4-2", title: "Annual Executive Report to MNBC Board", type: "executive-summary", status: "pending", owner: "Executive Director", dueDate: "2025-04-25" },
      { id: "rd-q4-3", title: "LOU Year-End Report to BC MoH", type: "narrative", status: "pending", owner: "Director of Health Equity", dueDate: "2025-04-30" },
      { id: "rd-q4-4", title: "Full Initiative Review Narratives", type: "narrative", status: "pending", owner: "Program Directors", dueDate: "2025-04-30" },
    ],
    linkedContractIds: ["ca-moh-2024", "ca-hc-2024"],
  },
];

// ── Policy Stubs ─────────────────────────────────────────────────────────────

export const POLICY_STUBS = [
  { id: "policy-1", title: "MNBC Chronic Disease Prevention Policy", stage: "Active", category: "Prevention" },
  { id: "policy-2", title: "Métis Cultural Safety Standards for Health Authorities", stage: "Active", category: "Cultural Safety" },
  { id: "policy-3", title: "MNBC Data Sovereignty and Governance Policy", stage: "Under Review", category: "Data Governance" },
  { id: "policy-4", title: "Métis Patient Navigation Framework", stage: "Draft", category: "Access" },
  { id: "policy-5", title: "MNBC-BC MoH Data Sharing Agreement — Métis Governance Provisions", stage: "Negotiation", category: "Data Governance" },
];

// ── Utility Functions ────────────────────────────────────────────────────────

export function getGoalById(id) {
  return GOALS.find((g) => g.id === id) ?? null;
}

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id) ?? null;
}

export function getInitiativesByPlanId(planId) {
  return INITIATIVES.filter((i) => i.planId === planId);
}

export function getInitiativesByGoalId(goalId) {
  return INITIATIVES.filter((i) => i.goalIds.includes(goalId));
}

export function getMilestonesByInitiativeId(initiativeId) {
  const initiative = INITIATIVES.find((i) => i.id === initiativeId);
  return initiative?.milestones ?? [];
}

export function getActionItemsByInitiativeId(initiativeId) {
  const initiative = INITIATIVES.find((i) => i.id === initiativeId);
  return initiative?.actionItems ?? [];
}

export function getKpisByGoalId(goalId) {
  return KPIS.filter((k) => k.goalIds.includes(goalId));
}

export function getOpenReportCycles() {
  return REPORT_CYCLES.filter((rc) => rc.status === "open" || rc.status === "upcoming");
}

export function getUpcomingDeadlines(daysAhead = 45) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const events = [];

  // Report cycle deadlines
  REPORT_CYCLES.filter((rc) => rc.status === "open" || rc.status === "upcoming").forEach((rc) => {
    const due = new Date(rc.dueDate);
    if (due <= cutoff) {
      events.push({ type: "report", id: rc.id, title: rc.title, dueDate: rc.dueDate, status: rc.status, period: rc.period });
    }
  });

  // Milestone deadlines
  INITIATIVES.forEach((init) => {
    init.milestones.forEach((ms) => {
      if (ms.status !== "complete" && ms.status !== "deferred") {
        const due = new Date(ms.dueDate);
        if (due <= cutoff) {
          events.push({ type: "milestone", id: ms.id, title: ms.title, dueDate: ms.dueDate, status: ms.status, initiativeTitle: init.title });
        }
      }
    });
  });

  // Action item deadlines
  INITIATIVES.forEach((init) => {
    init.actionItems.forEach((ai) => {
      if (ai.status !== "complete") {
        const due = new Date(ai.dueDate);
        if (due <= cutoff) {
          events.push({ type: "action", id: ai.id, title: ai.title, dueDate: ai.dueDate, status: ai.status, initiativeTitle: init.title, owner: ai.owner });
        }
      }
    });
  });

  return events.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export function getInitiativeHealth(initiative) {
  return initiative.health;
}

export function getScorecardForPeriod(period) {
  return SCORECARD_ENTRIES.filter((e) => e.period === period);
}

export function getOverdueMilestones() {
  const now = new Date();
  const result = [];
  INITIATIVES.forEach((init) => {
    init.milestones.forEach((ms) => {
      if (ms.status !== "complete" && ms.status !== "deferred" && new Date(ms.dueDate) < now) {
        result.push({ ...ms, initiativeTitle: init.title, initiativeId: init.id });
      }
    });
  });
  return result;
}

export function getOverdueActionItems() {
  const now = new Date();
  const result = [];
  INITIATIVES.forEach((init) => {
    init.actionItems.forEach((ai) => {
      if (ai.status !== "complete" && new Date(ai.dueDate) < now) {
        result.push({ ...ai, initiativeTitle: init.title });
      }
    });
  });
  return result;
}

export function computeGoalProgressFromKPIs(goalId) {
  const kpis = getKpisByGoalId(goalId);
  if (kpis.length === 0) return 0;
  const total = kpis.reduce((sum, k) => sum + k.progressPct, 0);
  return Math.round(total / kpis.length);
}

export function getAllMilestones() {
  return INITIATIVES.flatMap((i) => i.milestones.map((m) => ({ ...m, initiativeTitle: i.title, goalIds: i.goalIds })));
}

export function getAllActionItems() {
  return INITIATIVES.flatMap((i) => i.actionItems.map((a) => ({ ...a, initiativeTitle: i.title, goalIds: i.goalIds })));
}

export function getPolicyStubById(id) {
  return POLICY_STUBS.find((p) => p.id === id) ?? null;
}
