import React, { useState, useEffect } from 'react';
import { 
  Users, HelpCircle, Cpu, Sliders, ShieldAlert, Link as LinkIcon, 
  ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2, Save, FileText, AlertTriangle 
} from 'lucide-react';
import { WorkflowBuilder } from '../components/WorkflowBuilder';

const STEPS = [
  { id: 1, label: 'Team Info', icon: Users },
  { id: 2, label: 'Agent & Problem', icon: HelpCircle },
  { id: 3, label: 'Agent Design', icon: Cpu },
  { id: 4, label: 'Agent Workflow', icon: Sliders },
  { id: 5, label: 'Result & Safety', icon: ShieldAlert },
  { id: 6, label: 'Links', icon: LinkIcon }
];

const TOOLS_POOL = [
  'LLM', 'RAG', 'Database', 'REST API', 'Web Search', 
  'Authentication', 'External API', 'File Processing', 
  'Computer Vision', 'Speech', 'Other'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTION_OPTIONS = ['A', 'B', 'C', 'D'];

export default function ParticipantPortal({ showToast }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    submissionId: '',
    teamName: '',
    members: [
      { registrationNo: '', name: '', year: '3rd Year', section: 'A' }
    ],
    agentName: '',
    category: 'Other',
    problemStatement: '',
    targetUsers: '',
    userInputs: '',
    informationSources: '',
    decisions: '',
    tools: [],
    workflowSteps: [
      { stepNumber: 1, stepTitle: 'Receive Input', description: 'Agent takes raw inputs from user.' },
      { stepNumber: 2, stepTitle: 'Analyze & Decide', description: 'Agent determines goals and calls tools.' },
      { stepNumber: 3, stepTitle: 'Deliver Output', description: 'Agent formats and returns final results.' }
    ],
    expectedResult: '',
    successMetrics: '',
    risks: '',
    humanOversight: '',
    githubUrl: '',
    demoUrl: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('hackathon_expo_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        showToast('success', 'Loaded local draft submission.');
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, []);

  // Autosave to localStorage when formData changes
  useEffect(() => {
    if (!isSubmitted && formData.teamName) {
      const timer = setTimeout(() => {
        localStorage.setItem('hackathon_expo_draft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, isSubmitted]);

  // Handle manual/backend draft save
  const handleSaveDraftBackend = async () => {
    if (!formData.teamName.trim()) {
      showToast('error', 'Team Name is required to save a draft.');
      return;
    }

    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/submissions/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, submissionId: data.submissionId }));
        showToast('success', `Draft saved to server! ID: ${data.submissionId}`);
        // update localstorage draft with the received submissionId
        localStorage.setItem('hackathon_expo_draft', JSON.stringify({ ...formData, submissionId: data.submissionId }));
      } else {
        showToast('error', data.message || 'Error saving server draft.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Form Field Update Handlers
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Team Member modification
  const handleMemberChange = (idx, field, value) => {
    const newMembers = formData.members.map((member, i) => {
      if (idx === i) {
        return { ...member, [field]: value };
      }
      return member;
    });
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { registrationNo: '', name: '', year: '3rd Year', section: 'A' }]
    }));
  };

  const removeMember = (idx) => {
    if (formData.members.length === 1) {
      showToast('warning', 'You must have at least one team member.');
      return;
    }
    const filtered = formData.members.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, members: filtered }));
  };

  // Tools toggle
  const toggleTool = (tool) => {
    const activeTools = formData.tools.includes(tool)
      ? formData.tools.filter(t => t !== tool)
      : [...formData.tools, tool];
    setFormData(prev => ({ ...prev, tools: activeTools }));
  };

  // Validate step fields
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.teamName.trim()) errors.teamName = 'Team Name is required.';
      formData.members.forEach((m, idx) => {
        if (!m.registrationNo.trim()) errors[`member_reg_${idx}`] = 'Reg Number is required.';
        if (!m.name.trim()) errors[`member_name_${idx}`] = 'Name is required.';
      });
    } else if (step === 2) {
      if (!formData.agentName.trim()) errors.agentName = 'Agent Name is required.';
      if (!formData.problemStatement.trim()) errors.problemStatement = 'Problem statement is required.';
      if (!formData.targetUsers.trim()) errors.targetUsers = 'Target users definition is required.';
      if (!formData.userInputs.trim()) errors.userInputs = 'User inputs definition is required.';
    } else if (step === 3) {
      if (!formData.informationSources.trim()) errors.informationSources = 'Information sources description is required.';
      if (!formData.decisions.trim()) errors.decisions = 'Decision making outline is required.';
      if (formData.tools.length === 0) errors.tools = 'Select at least one tool.';
    } else if (step === 4) {
      if (formData.workflowSteps.length === 0) {
        errors.workflow = 'Please provide at least one workflow step.';
      } else {
        formData.workflowSteps.forEach((s, idx) => {
          if (!s.stepTitle.trim() || !s.description.trim()) {
            errors.workflow = 'All step titles and descriptions must be filled.';
          }
        });
      }
    } else if (step === 5) {
      if (!formData.expectedResult.trim()) errors.expectedResult = 'Expected result description is required.';
      if (!formData.successMetrics.trim()) errors.successMetrics = 'Success metrics definition is required.';
      if (!formData.risks.trim()) errors.risks = 'Risks list is required.';
      if (!formData.humanOversight.trim()) errors.humanOversight = 'Human oversight description is required.';
    } else if (step === 6) {
      const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/;
      if (!formData.githubUrl.trim()) {
        errors.githubUrl = 'GitHub/GitLab Link is required.';
      } else if (!urlRegex.test(formData.githubUrl)) {
        errors.githubUrl = 'Invalid URL format.';
      }
      if (!formData.demoUrl.trim()) {
        errors.demoUrl = 'Demo Link is required.';
      } else if (!urlRegex.test(formData.demoUrl)) {
        errors.demoUrl = 'Invalid URL format.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep(prev => prev + 1);
        // Save draft to backend as they advance
        handleSaveDraftBackend();
      } else {
        // Go to review phase
        setCurrentStep(7);
      }
    } else {
      showToast('error', 'Please correct the validation errors in the form.');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitProject = async () => {
    // Validate everything
    let allValid = true;
    for (let s = 1; s <= 6; s++) {
      if (!validateStep(s)) {
        allValid = false;
        setCurrentStep(s);
        showToast('error', `Validation failed on Step ${s}. Please correct.`);
        return;
      }
    }

    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSubmissionResult(data);
        setIsSubmitted(true);
        localStorage.removeItem('hackathon_expo_draft'); // clear draft
        showToast('success', 'Project submitted successfully!');
      } else {
        showToast('error', data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error during submission.');
    }
  };

  if (isSubmitted && submissionResult) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '4rem auto',
        padding: '2.5rem',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#d1fae5',
          color: '#065f46',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle2 size={38} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Submission Successful
        </h2>
        <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Thank you for registering. Your project has been logged in the portal.
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Submission ID:</span>
            <strong style={{ color: '#1e293b', fontFamily: 'monospace', fontSize: '1rem' }}>{submissionResult.submissionId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Team Name:</span>
            <strong style={{ color: '#1e293b' }}>{submissionResult.teamName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Submitted Date/Time:</span>
            <span style={{ color: '#1e293b' }}>{new Date(submissionResult.submittedDate).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Status:</span>
            <span className="badge badge-submitted">{submissionResult.status}</span>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => {
            setIsSubmitted(false);
            setSubmissionResult(null);
            setFormData({
              submissionId: '',
              teamName: '',
              members: [{ registrationNo: '', name: '', year: '3rd Year', section: 'A' }],
              agentName: '',
              category: 'Other',
              problemStatement: '',
              targetUsers: '',
              userInputs: '',
              informationSources: '',
              decisions: '',
              tools: [],
              workflowSteps: [
                { stepNumber: 1, stepTitle: 'Receive Input', description: 'Agent takes raw inputs from user.' },
                { stepNumber: 2, stepTitle: 'Analyze & Decide', description: 'Agent determines goals and calls tools.' },
                { stepNumber: 3, stepTitle: 'Deliver Output', description: 'Agent formats and returns final results.' }
              ],
              expectedResult: '',
              successMetrics: '',
              risks: '',
              humanOversight: '',
              githubUrl: '',
              demoUrl: ''
            });
            setCurrentStep(1);
          }}
        >
          Submit Another Project
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1.25rem 2rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary)' }}>
            Hackathon Intake Portal
          </span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            AI Agent Expo & AI Hackathon
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={handleSaveDraftBackend}
            disabled={isSavingDraft}
          >
            <Save size={14} /> {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          {formData.submissionId && (
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              Draft ID: {formData.submissionId}
            </span>
          )}
        </div>
      </div>

      {/* Grid: Stepper + Form Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '2rem'
      }} className="dashboard-layout">
        
        {/* Left-side Progress indicator */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem 1rem',
          height: 'fit-content',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', paddingLeft: '0.5rem' }}>
            Submission Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {STEPS.map((s) => {
              const StepIcon = s.icon;
              const isCurrent = s.id === currentStep;
              const isCompleted = s.id < currentStep || currentStep === 7;
              
              return (
                <button
                  key={s.id}
                  disabled={currentStep === 7 && s.id !== 7}
                  onClick={() => {
                    if (currentStep !== 7 && s.id <= currentStep) {
                      // Only allow navigation back to already checked/filled steps
                      setCurrentStep(s.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isCurrent ? 'var(--primary-light)' : 'transparent',
                    color: isCurrent ? 'var(--primary)' : isCompleted ? '#475569' : '#94a3b8',
                    fontWeight: isCurrent || isCompleted ? 600 : 400,
                    textAlign: 'left',
                    width: '100%',
                    cursor: (currentStep === 7 || s.id > currentStep) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary)' : isCompleted ? '#16a34a' : '#e2e8f0',
                    color: isCurrent || isCompleted ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {isCompleted ? '✓' : s.id}
                  </div>
                  <span style={{ fontSize: '0.8125rem' }}>{s.label}</span>
                </button>
              );
            })}
            <button
              disabled={true}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: currentStep === 7 ? 'var(--primary-light)' : 'transparent',
                color: currentStep === 7 ? 'var(--primary)' : '#94a3b8',
                fontWeight: currentStep === 7 ? 600 : 400,
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: currentStep === 7 ? 'var(--primary)' : '#e2e8f0',
                color: currentStep === 7 ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                R
              </div>
              <span style={{ fontSize: '0.8125rem' }}>Review & Submit</span>
            </button>
          </div>
        </div>

        {/* Right-side Step forms */}
        <div className="card" style={{ padding: '2rem' }}>
          
          {/* STEP 1: TEAM INFORMATION */}
          {currentStep === 1 && (
            <div>
              <h2 className="card-title">Step 1 — Team Information</h2>
              <div className="form-group">
                <label className="form-label">Team Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="teamName"
                  className={`form-control ${validationErrors.teamName ? 'error' : ''}`}
                  placeholder="Enter a professional team name (e.g. AgriMitra Developers)"
                  value={formData.teamName}
                  onChange={handleTextChange}
                />
                {validationErrors.teamName && <div className="form-error">{validationErrors.teamName}</div>}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>Team Members</h4>
                {formData.members.map((member, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    backgroundColor: '#f8fafc',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Member #{idx + 1}</span>
                      {formData.members.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeMember(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Registration No <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. 23A91A0501"
                          className={`form-control ${validationErrors[`member_reg_${idx}`] ? 'error' : ''}`}
                          value={member.registrationNo}
                          onChange={(e) => handleMemberChange(idx, 'registrationNo', e.target.value)}
                        />
                        {validationErrors[`member_reg_${idx}`] && <div className="form-error">{validationErrors[`member_reg_${idx}`]}</div>}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Kumar"
                          className={`form-control ${validationErrors[`member_name_${idx}`] ? 'error' : ''}`}
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        />
                        {validationErrors[`member_name_${idx}`] && <div className="form-error">{validationErrors[`member_name_${idx}`]}</div>}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Year <span className="required">*</span></label>
                        <select
                          className="form-control"
                          value={member.year}
                          onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                        >
                          {YEAR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Section <span className="required">*</span></label>
                        <select
                          className="form-control"
                          value={member.section}
                          onChange={(e) => handleMemberChange(idx, 'section', e.target.value)}
                        >
                          {SECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={addMember}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}
                >
                  <Plus size={14} /> Add Team Member
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AGENT & PROBLEM */}
          {currentStep === 2 && (
            <div>
              <h2 className="card-title">Step 2 — Agent & Problem Statement</h2>
              
              <div className="form-group">
                <label className="form-label">Agent Name / Project Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="agentName"
                  className={`form-control ${validationErrors.agentName ? 'error' : ''}`}
                  placeholder="e.g. AgriMitra: RAG-based Crop Advisor"
                  value={formData.agentName}
                  onChange={handleTextChange}
                />
                {validationErrors.agentName && <div className="form-error">{validationErrors.agentName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Agent Category <span className="required">*</span></label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleTextChange}
                >
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Automation">Automation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">What problem should it solve? <span className="required">*</span></label>
                <textarea
                  name="problemStatement"
                  rows={3}
                  className={`form-control ${validationErrors.problemStatement ? 'error' : ''}`}
                  placeholder="Provide a detailed overview of the problem, background details, and current challenges."
                  value={formData.problemStatement}
                  onChange={handleTextChange}
                />
                {validationErrors.problemStatement && <div className="form-error">{validationErrors.problemStatement}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Who will use it? (Target Users) <span className="required">*</span></label>
                <textarea
                  name="targetUsers"
                  rows={2}
                  className={`form-control ${validationErrors.targetUsers ? 'error' : ''}`}
                  placeholder="Describe your user demographics (e.g. Farmers in rural areas, clerks in government departments)"
                  value={formData.targetUsers}
                  onChange={handleTextChange}
                />
                {validationErrors.targetUsers && <div className="form-error">{validationErrors.targetUsers}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">What will users give the agent? (User Inputs) <span className="required">*</span></label>
                <textarea
                  name="userInputs"
                  rows={2}
                  className={`form-control ${validationErrors.userInputs ? 'error' : ''}`}
                  placeholder="e.g. Crop disease leaf photo, geolocation, audio description of crop symptom."
                  value={formData.userInputs}
                  onChange={handleTextChange}
                />
                {validationErrors.userInputs && <div className="form-error">{validationErrors.userInputs}</div>}
              </div>
            </div>
          )}

          {/* STEP 3: AGENT DESIGN */}
          {currentStep === 3 && (
            <div>
              <h2 className="card-title">Step 3 — Agent Design</h2>
              
              <div className="form-group">
                <label className="form-label">What information should it use? <span className="required">*</span></label>
                <textarea
                  name="informationSources"
                  rows={3}
                  className={`form-control ${validationErrors.informationSources ? 'error' : ''}`}
                  placeholder="Describe what external data, local files, or knowledge systems the agent relies on (e.g. ICAR farming documents, government mandi price database)"
                  value={formData.informationSources}
                  onChange={handleTextChange}
                />
                {validationErrors.informationSources && <div className="form-error">{validationErrors.informationSources}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">What decisions should it make? <span className="required">*</span></label>
                <textarea
                  name="decisions"
                  rows={3}
                  className={`form-control ${validationErrors.decisions ? 'error' : ''}`}
                  placeholder="Outline the critical routing or logical decision forks the agent handles (e.g. Decides whether to invoke chemical pesticide recommendations based on severe damage thresholds)"
                  value={formData.decisions}
                  onChange={handleTextChange}
                />
                {validationErrors.decisions && <div className="form-error">{validationErrors.decisions}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Which tools may be needed? <span className="required">*</span></label>
                <span className="form-helper" style={{ display: 'block', marginBottom: '0.5rem' }}>Select all that apply:</span>
                <div className="tools-grid">
                  {TOOLS_POOL.map(tool => (
                    <div 
                      key={tool} 
                      className={`tool-checkbox-card ${formData.tools.includes(tool) ? 'selected' : ''}`}
                      onClick={() => toggleTool(tool)}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.tools.includes(tool)}
                        onChange={() => {}} // toggled in container click
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
                {validationErrors.tools && <div className="form-error" style={{ marginTop: '0.5rem' }}>{validationErrors.tools}</div>}
              </div>
            </div>
          )}

          {/* STEP 4: AGENT WORKFLOW */}
          {currentStep === 4 && (
            <div>
              <h2 className="card-title">Step 4 — Agent Workflow</h2>
              <span className="form-helper" style={{ display: 'block', marginBottom: '1rem' }}>
                Define the logical execution steps. Map out how data is ingested, processed, audited, and resolved.
              </span>
              
              <WorkflowBuilder 
                steps={formData.workflowSteps}
                onChange={(steps) => setFormData(prev => ({ ...prev, workflowSteps: steps }))}
              />
              {validationErrors.workflow && <div className="form-error" style={{ marginTop: '0.5rem' }}>{validationErrors.workflow}</div>}
            </div>
          )}

          {/* STEP 5: RESULT & SAFETY */}
          {currentStep === 5 && (
            <div>
              <h2 className="card-title">Step 5 — Result & Safety</h2>
              
              <div className="form-group">
                <label className="form-label">What should the final result be? <span className="required">*</span></label>
                <textarea
                  name="expectedResult"
                  rows={2}
                  className={`form-control ${validationErrors.expectedResult ? 'error' : ''}`}
                  placeholder="e.g. A localized report in Kannada detailing crop leaf diagnosis, spray prescription, and price indices."
                  value={formData.expectedResult}
                  onChange={handleTextChange}
                />
                {validationErrors.expectedResult && <div className="form-error">{validationErrors.expectedResult}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">How will you know it is useful? (Success Metrics) <span className="required">*</span></label>
                <textarea
                  name="successMetrics"
                  rows={2}
                  className={`form-control ${validationErrors.successMetrics ? 'error' : ''}`}
                  placeholder="e.g. Reduction in doctor queue times by 20%, or 90% accuracy in automated legal clause flagging."
                  value={formData.successMetrics}
                  onChange={handleTextChange}
                />
                {validationErrors.successMetrics && <div className="form-error">{validationErrors.successMetrics}</div>}
              </div>

              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '1.25rem',
                marginTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Risk Awareness & Human Oversight</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#7c2d12' }}>What can go wrong? (Risks) <span className="required">*</span></label>
                  <textarea
                    name="risks"
                    rows={2}
                    className={`form-control ${validationErrors.risks ? 'error' : ''}`}
                    placeholder="e.g. Hallucinated pesticide dosage calculations, false negative symptom triage."
                    value={formData.risks}
                    onChange={handleTextChange}
                    style={{ borderColor: '#fed7aa' }}
                  />
                  {validationErrors.risks && <div className="form-error">{validationErrors.risks}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#7c2d12' }}>What should a person check? (Human Oversight) <span className="required">*</span></label>
                  <textarea
                    name="humanOversight"
                    rows={2}
                    className={`form-control ${validationErrors.humanOversight ? 'error' : ''}`}
                    placeholder="Describe how humans approve or audit the agent's work (e.g. Agronomist reviews toxic advice list, Doctor overrides red-level triage calls)"
                    value={formData.humanOversight}
                    onChange={handleTextChange}
                    style={{ borderColor: '#fed7aa' }}
                  />
                  {validationErrors.humanOversight && <div className="form-error">{validationErrors.humanOversight}</div>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: LINKS */}
          {currentStep === 6 && (
            <div>
              <h2 className="card-title">Step 6 — Project Links</h2>
              
              <div className="form-group">
                <label className="form-label">GitHub / GitLab Link <span className="required">*</span></label>
                <input
                  type="text"
                  name="githubUrl"
                  className={`form-control ${validationErrors.githubUrl ? 'error' : ''}`}
                  placeholder="https://github.com/username/project"
                  value={formData.githubUrl}
                  onChange={handleTextChange}
                />
                {validationErrors.githubUrl && <div className="form-error">{validationErrors.githubUrl}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Demo / Deployment Link <span className="required">*</span></label>
                <input
                  type="text"
                  name="demoUrl"
                  className={`form-control ${validationErrors.demoUrl ? 'error' : ''}`}
                  placeholder="https://my-agent-demo.vercel.app"
                  value={formData.demoUrl}
                  onChange={handleTextChange}
                />
                {validationErrors.demoUrl && <div className="form-error">{validationErrors.demoUrl}</div>}
              </div>
            </div>
          )}

          {/* REVIEW PAGE */}
          {currentStep === 7 && (
            <div>
              <h2 className="card-title" style={{ fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                Review Your Submission
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.875rem' }}>
                
                {/* Team Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>TEAM INFORMATION</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Team Name:</strong> {formData.teamName}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '4px 0' }}>Reg No.</th>
                          <th>Name</th>
                          <th>Year</th>
                          <th>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.members.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 0', fontFamily: 'monospace' }}>{m.registrationNo}</td>
                            <td>{m.name}</td>
                            <td>{m.year}</td>
                            <td>{m.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Problem Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>AGENT & PROBLEM</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>Agent Name:</strong> {formData.agentName}</p>
                    <p><strong>Category:</strong> {formData.category}</p>
                    <p><strong>Problem to Solve:</strong> {formData.problemStatement}</p>
                    <p><strong>Target Users:</strong> {formData.targetUsers}</p>
                    <p><strong>User Inputs:</strong> {formData.userInputs}</p>
                  </div>
                </div>

                {/* Design Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>AGENT DESIGN</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>Information Used:</strong> {formData.informationSources}</p>
                    <p><strong>Decisions Made:</strong> {formData.decisions}</p>
                    <p><strong>Tools Checked:</strong> {formData.tools.join(', ') || 'None selected'}</p>
                  </div>
                </div>

                {/* Workflow Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>AGENT WORKFLOW</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {formData.workflowSteps.map((step, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0', borderBottom: idx === formData.workflowSteps.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                        <strong>{step.stepNumber}. {step.stepTitle}</strong>
                        <p style={{ color: '#475569', fontSize: '0.8125rem', marginTop: '2px' }}>{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>RESULT & SAFETY</h3>
                  <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '6px', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>Expected Output:</strong> {formData.expectedResult}</p>
                    <p><strong>Success Metrics:</strong> {formData.successMetrics}</p>
                    <p style={{ color: '#c2410c' }}><strong>Identified Risks:</strong> {formData.risks}</p>
                    <p style={{ color: '#c2410c' }}><strong>Human Oversight Check:</strong> {formData.humanOversight}</p>
                  </div>
                </div>

                {/* Links Section */}
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>LINKS</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>GitHub Link:</strong> <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{formData.githubUrl}</a></p>
                    <p><strong>Demo Link:</strong> <a href={formData.demoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{formData.demoUrl}</a></p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.25rem'
          }}>
            {currentStep > 1 && currentStep < 7 ? (
              <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : currentStep === 7 ? (
              <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(6)}>
                Edit Submission
              </button>
            ) : (
              <div></div> // Empty div for spacing
            )}

            {currentStep < 7 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-success btn-lg" onClick={handleSubmitProject}>
                <CheckCircle2 size={18} /> Submit Project
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
