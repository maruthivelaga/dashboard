import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FolderGit, Users2, UserCheck, BarChart3, Settings, LogOut, 
  Search, Filter, ChevronLeft, ChevronRight, ExternalLink, ArrowUpDown, CheckSquare, 
  Star, StarHalf, Play, Check, ShieldAlert, Award, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { BarChart, DonutChart } from '../components/Charts';

const CRITERIA_KEYS = [
  { key: 'problemRelevance', label: 'Problem Relevance' },
  { key: 'agenticReasoning', label: 'Agentic Reasoning' },
  { key: 'technicalFeasibility', label: 'Technical Feasibility' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'usefulness', label: 'Usefulness' },
  { key: 'humanOversight', label: 'Human Oversight' },
  { key: 'demoReadiness', label: 'Demo Readiness' }
];

export default function AdminDashboard({ showToast, onLogout, adminUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [teams, setTeams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Table state (Submissions)
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTool, setFilterTool] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Teams & Participants Search state
  const [teamSearch, setTeamSearch] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');

  // Review scores state
  const [scores, setScores] = useState({
    problemRelevance: 5,
    agenticReasoning: 5,
    technicalFeasibility: 5,
    innovation: 5,
    usefulness: 5,
    humanOversight: 5,
    demoReadiness: 5
  });
  const [reviewerComments, setReviewerComments] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [shortlisted, setShortlisted] = useState(false);

  // Load dashboard/analytics data
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/dashboard/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Error loading analytics.');
    }
  };

  // Load submissions list
  const fetchSubmissions = async () => {
    try {
      const query = new URLSearchParams({
        search,
        year: filterYear,
        section: filterSection,
        status: filterStatus,
        category: filterCategory,
        tool: filterTool,
        sortBy,
        sortOrder,
        page,
        limit: 8
      });
      const res = await fetch(`/dashboard/api/submissions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Error loading submissions.');
    }
  };

  // Load teams listing
  const fetchTeams = async () => {
    try {
      const query = new URLSearchParams({
        search: teamSearch
      });
      const res = await fetch(`/dashboard/api/teams?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load participants listing
  const fetchParticipants = async () => {
    try {
      const query = new URLSearchParams({
        search: participantSearch
      });
      const res = await fetch(`/dashboard/api/participants?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger data fetches on tab change and filter updates
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAnalytics();
    } else if (activeTab === 'submissions') {
      fetchSubmissions();
    } else if (activeTab === 'teams') {
      fetchTeams();
    } else if (activeTab === 'participants') {
      fetchParticipants();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [
    activeTab, search, filterYear, filterSection, filterStatus, filterCategory, 
    filterTool, sortBy, sortOrder, page, teamSearch, participantSearch
  ]);

  // Handle detailed project fetching
  useEffect(() => {
    if (selectedSubId) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/dashboard/api/submissions/${selectedSubId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedSub(data);
            
            // Populate review form values
            const rev = data.review || {};
            setScores({
              problemRelevance: rev.problemRelevance || 5,
              agenticReasoning: rev.agenticReasoning || 5,
              technicalFeasibility: rev.technicalFeasibility || 5,
              innovation: rev.innovation || 5,
              usefulness: rev.usefulness || 5,
              humanOversight: rev.humanOversight || 5,
              demoReadiness: rev.demoReadiness || 5
            });
            setReviewerComments(rev.reviewerComments || '');
            setInternalNotes(rev.internalNotes || '');
            setShortlisted(rev.shortlisted || false);
          }
        } catch (e) {
          console.error(e);
          showToast('error', 'Error loading project detail.');
        }
      };
      fetchDetail();
    } else {
      setSelectedSub(null);
    }
  }, [selectedSubId]);

  // Live total/average score calculation for the review panel
  const totalScore = Object.values(scores).reduce((sum, s) => sum + Number(s), 0);
  const averageScore = Math.round((totalScore / 7) * 10) / 10;

  const handleScoreChange = (criteria, value) => {
    setScores(prev => ({ ...prev, [criteria]: Number(value) }));
  };

  // Submit evaluation review
  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      const res = await fetch(`/dashboard/api/submissions/${selectedSub._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hackathon_admin_token')}`
        },
        body: JSON.stringify({
          ...scores,
          reviewerComments,
          internalNotes,
          shortlisted
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Review and scores saved successfully!');
        setSelectedSub(data.submission);
        // refresh stats
        fetchAnalytics();
      } else {
        showToast('error', data.message || 'Error saving review.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving review.');
    }
  };

  // Quick Action: Update Status directly
  const handleUpdateStatus = async (status) => {
    if (!selectedSub) return;
    try {
      const res = await fetch(`/dashboard/api/submissions/${selectedSub._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hackathon_admin_token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', `Status updated to ${status}`);
        setSelectedSub(data.submission);
        fetchAnalytics();
      } else {
        showToast('error', data.message || 'Error updating status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Draft': return 'badge badge-draft';
      case 'Submitted': return 'badge badge-submitted';
      case 'Under Review': return 'badge badge-under-review';
      case 'Reviewed': return 'badge badge-reviewed';
      case 'Shortlisted': return 'badge badge-shortlisted';
      default: return 'badge';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-header">
            <div style={{ background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
              AG
            </div>
            <div>
              <span className="sidebar-title">AI Agent Expo & AI Hackathon</span>
              <span className="sidebar-subtitle">Hackathon Portal</span>
            </div>
          </div>
          
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <button 
                onClick={() => { setActiveTab('dashboard'); setSelectedSubId(null); }}
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button 
                onClick={() => { setActiveTab('submissions'); setSelectedSubId(null); }}
                className={`sidebar-link ${activeTab === 'submissions' ? 'active' : ''}`}
              >
                <FolderGit size={18} />
                <span>Submissions</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button 
                onClick={() => { setActiveTab('teams'); setSelectedSubId(null); }}
                className={`sidebar-link ${activeTab === 'teams' ? 'active' : ''}`}
              >
                <Users2 size={18} />
                <span>Teams</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {adminUser ? adminUser.name.charAt(0) : 'A'}
            </div>
            <div className="admin-info">
              <span className="admin-name">{adminUser ? adminUser.name : 'Administrator'}</span>
              <span className="admin-role">System Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        
        {/* VIEW 1: PROJECT DETAIL PAGE */}
        {selectedSubId && selectedSub ? (
          <div>
            {/* Detail View Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <button onClick={() => setSelectedSubId(null)} className="btn btn-secondary btn-sm" style={{ marginBottom: '0.75rem' }}>
                  ← Back to List
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{selectedSub.agentName}</h1>
                  <span className={getStatusBadgeClass(selectedSub.status)}>{selectedSub.status}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Team: <strong>{selectedSub.teamName}</strong> | ID: <span style={{ fontFamily: 'monospace' }}>{selectedSub.submissionId}</span> | Submitted: {new Date(selectedSub.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={selectedSub.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  <ExternalLink size={14} /> Open GitHub
                </a>
                <a href={selectedSub.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  <Play size={14} /> Open Demo
                </a>
                {selectedSub.status === 'Submitted' && (
                  <button onClick={() => handleUpdateStatus('Under Review')} className="btn btn-primary btn-sm">
                    Mark Under Review
                  </button>
                )}
                {selectedSub.status === 'Under Review' && (
                  <button onClick={() => handleUpdateStatus('Reviewed')} className="btn btn-success btn-sm">
                    Mark Reviewed
                  </button>
                )}
                <button 
                  onClick={() => {
                    const nextStatus = selectedSub.status === 'Shortlisted' ? 'Reviewed' : 'Shortlisted';
                    handleUpdateStatus(nextStatus);
                  }}
                  className={`btn btn-sm ${selectedSub.status === 'Shortlisted' ? 'btn-success' : 'btn-secondary'}`}
                  style={{ borderColor: selectedSub.status === 'Shortlisted' ? 'transparent' : 'var(--border-color)' }}
                >
                  <Award size={14} /> {selectedSub.status === 'Shortlisted' ? 'Shortlisted ✓' : 'Shortlist'}
                </button>
              </div>
            </div>

            {/* Layout: Info Columns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="card">
                  <h3 className="card-title">Team Information</h3>
                  <div style={{ fontSize: '0.875rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Team Name:</strong> {selectedSub.teamName}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                          <th style={{ padding: '6px 0' }}>Reg No.</th>
                          <th>Name</th>
                          <th>Year</th>
                          <th>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSub.members.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 0', fontFamily: 'monospace' }}>{m.registrationNo}</td>
                            <td>{m.name}</td>
                            <td>{m.year}</td>
                            <td>{m.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">Problem Statement</h3>
                  <p style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {selectedSub.problemStatement}
                  </p>
                </div>

                <div className="card">
                  <h3 className="card-title">Agent Design & Logic</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Target Users:</strong>
                      <p style={{ color: '#334155', marginTop: '2px' }}>{selectedSub.targetUsers}</p>
                    </div>
                    <div>
                      <strong>User Inputs:</strong>
                      <p style={{ color: '#334155', marginTop: '2px' }}>{selectedSub.userInputs}</p>
                    </div>
                    <div>
                      <strong>Information Sources Used:</strong>
                      <p style={{ color: '#334155', marginTop: '2px' }}>{selectedSub.informationSources}</p>
                    </div>
                    <div>
                      <strong>Decision Making Scope:</strong>
                      <p style={{ color: '#334155', marginTop: '2px' }}>{selectedSub.decisions}</p>
                    </div>
                    <div>
                      <strong>Required Tools:</strong>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '4px' }}>
                        {selectedSub.tools.map(tool => (
                          <span key={tool} style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                            {tool}
                          </span>
                        ))}
                        {selectedSub.tools.length === 0 && <span style={{ color: '#94a3b8' }}>None selected</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">Agent Execution Workflow</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedSub.workflowSteps.map((step) => (
                      <div key={step._id || step.stepNumber} style={{
                        display: 'flex',
                        gap: '0.75rem',
                        fontSize: '0.875rem',
                        borderLeft: '2px solid #cbd5e1',
                        paddingLeft: '0.75rem',
                        marginLeft: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{step.stepNumber}</div>
                        <div>
                          <strong>{step.stepTitle}</strong>
                          <p style={{ color: '#475569', fontSize: '0.8125rem', marginTop: '1px' }}>{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ borderColor: 'var(--warning-border)', background: 'var(--warning-light)' }}>
                  <h3 className="card-title" style={{ color: '#c2410c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={18} /> Safety, Risks & Oversight
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                    <div>
                      <strong style={{ color: '#7c2d12' }}>Expected Result:</strong>
                      <p style={{ color: '#475569', marginTop: '2px' }}>{selectedSub.expectedResult}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#7c2d12' }}>Success Metrics:</strong>
                      <p style={{ color: '#475569', marginTop: '2px' }}>{selectedSub.successMetrics}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#7c2d12' }}>Identified Risks:</strong>
                      <p style={{ color: '#b91c1c', marginTop: '2px', fontWeight: 500 }}>{selectedSub.risks}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#7c2d12' }}>Human Oversight / Audits:</strong>
                      <p style={{ color: '#15803d', marginTop: '2px', fontWeight: 500 }}>{selectedSub.humanOversight}</p>
                    </div>
                  </div>
                </div>

            </div>
          </div>
        ) : (
          /* TAB DIRECTORY VIEWS */
          <div>
            
            {/* Header Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '1rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  AI Agent Expo & AI Hackathon
                </h1>
                <p style={{ color: '#475569', fontSize: '0.875rem' }}>
                  Agentic AI Hackathon — Submission & Evaluation Dashboard
                </p>
              </div>
            </div>

            {/* TAB CONTENT: DASHBOARD HOME */}
            {activeTab === 'dashboard' && analytics && (
              <div>
                {/* KPI Cards */}
                <div className="kpi-container">
                  <div className="kpi-card accent-blue">
                    <div className="kpi-header">
                      <span>Total Teams</span>
                      <div className="kpi-icon-container"><Users2 size={14} /></div>
                    </div>
                    <span className="kpi-value">{analytics.kpis.totalTeams}</span>
                  </div>
                  
                  <div className="kpi-card">
                    <div className="kpi-header">
                      <span>Total Participants</span>
                      <div className="kpi-icon-container"><UserCheck size={14} /></div>
                    </div>
                    <span className="kpi-value">{analytics.kpis.totalParticipants}</span>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-header">
                      <span>Projects Submitted</span>
                      <div className="kpi-icon-container"><FolderGit size={14} /></div>
                    </div>
                    <span className="kpi-value" style={{ color: 'var(--primary)' }}>{analytics.kpis.projectsSubmitted}</span>
                  </div>

                </div>

                {/* Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="grid-cols-2">
                  <div className="card">
                    <BarChart data={analytics.charts.projectsByYear} title="Projects by Student Year" color="#2563eb" />
                  </div>
                  <div className="card">
                    <BarChart data={analytics.charts.projectsBySection} title="Projects by Class Section" color="#475569" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-cols-2">
                  <div className="card">
                    <DonutChart data={analytics.charts.submissionStatus} title="Submission Lifecycle Status" colors={['#2563eb', '#ea580c', '#16a34a', '#8b5cf6']} />
                  </div>

                  <div className="card">
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Top Agent Categories</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(analytics.charts.agentCategories).sort((a,b) => b[1] - a[1]).map(([cat, count]) => (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                          <span style={{ color: '#475569', fontWeight: 500 }}>{cat}</span>
                          <span className="badge badge-submitted">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: SUBMISSIONS PAGE */}
            {activeTab === 'submissions' && (
              <div>
                {/* Advanced Search & Filtering Bar */}
                <div className="filter-bar">
                  <div className="search-input-wrapper">
                    <Search size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Submission ID, Team, Agent..."
                      style={{ paddingLeft: '2rem' }}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>

                  <select className="form-control" style={{ width: 'auto', minWidth: '120px' }} value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}>
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>

                  <select className="form-control" style={{ width: 'auto', minWidth: '100px' }} value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setPage(1); }}>
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>

                  <select className="form-control" style={{ width: 'auto', minWidth: '130px' }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Shortlisted">Shortlisted</option>
                  </select>

                  <select className="form-control" style={{ width: 'auto', minWidth: '140px' }} value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
                    <option value="">All Categories</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Automation">Automation</option>
                    <option value="Other">Other</option>
                  </select>

                  <select className="form-control" style={{ width: 'auto', minWidth: '110px' }} value={filterTool} onChange={(e) => { setFilterTool(e.target.value); setPage(1); }}>
                    <option value="">All Tools</option>
                    {['LLM', 'RAG', 'Database', 'REST API', 'Web Search', 'Computer Vision', 'Speech'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <button 
                    onClick={() => {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <ArrowUpDown size={14} /> Sort {sortBy === 'createdAt' ? 'Date' : sortBy} ({sortOrder})
                  </button>

                  <select className="form-control" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="createdAt">Date Submitted</option>
                    <option value="score">Evaluation Score</option>
                    <option value="teamName">Team Name</option>
                  </select>
                </div>

                {/* Submissions Data Table */}
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Team Name</th>
                        <th>Agent Name</th>
                        <th>Members</th>
                        <th>Year</th>
                        <th>Section</th>
                        <th>Status</th>
                        <th>Submitted Date</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr 
                          key={sub._id} 
                          onClick={() => setSelectedSubId(sub._id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{sub.submissionId}</td>
                          <td style={{ fontWeight: 600 }}>{sub.teamName}</td>
                          <td>{sub.agentName || <span style={{ color: '#cbd5e1' }}>Untitled Draft</span>}</td>
                          <td>{sub.members.length} members</td>
                          <td>{sub.members[0]?.year || 'N/A'}</td>
                          <td>{sub.members[0]?.section || 'N/A'}</td>
                          <td>
                            <span className={getStatusBadgeClass(sub.status)}>{sub.status}</span>
                          </td>
                          <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {sub.review?.averageScore > 0 ? sub.review.averageScore : '-'}
                          </td>
                          <td>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubId(sub._id);
                              }} 
                              className="btn btn-secondary btn-sm"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}

                      {submissions.length === 0 && (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                            No submissions found matching the query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Footer */}
                  <div className="pagination-container">
                    <span>
                      Showing {submissions.length} of {totalItems} submissions
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span>Page {page} of {totalPages}</span>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        disabled={page === totalPages || totalPages === 0}
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: TEAMS PAGE */}
            {activeTab === 'teams' && (
              <div>
                <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
                  <div className="search-input-wrapper" style={{ maxWidth: '350px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Teams by Name, Agent..."
                      style={{ paddingLeft: '2rem' }}
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                    Total teams listed: {teams.length}
                  </span>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Team Name</th>
                        <th>Members Info (Registration numbers)</th>
                        <th>Year</th>
                        <th>Section</th>
                        <th>Agent Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t) => (
                        <tr key={t._id}>
                          <td style={{ fontWeight: 700 }}>{t.name}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                              {t.members.map((m, idx) => (
                                <span key={idx} style={{ color: '#475569' }}>
                                  {m.name} (<span style={{ fontFamily: 'monospace' }}>{m.registrationNo}</span>)
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>{t.year}</td>
                          <td>{t.section}</td>
                          <td>{t.agentName || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                        </tr>
                      ))}

                      {teams.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                            No teams records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
