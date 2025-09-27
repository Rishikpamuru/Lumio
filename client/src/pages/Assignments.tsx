import React, { useEffect, useState } from 'react';
import { ClassAPI, AssignmentAPI, api } from '../lib/api';
import { useAuthStore } from '../state/authStore';
import { SubmissionViewer } from '../components/SubmissionViewer';

interface ClassRec { id: string; name: string; }
interface AssignmentRec { id: string; title: string; description?: string; dueDate?: string; submissionType?: string; class?: { name: string }; }

export const Assignments: React.FC = () => {
	const { user } = useAuthStore();
	const [assignments, setAssignments] = useState<AssignmentRec[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);
		const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<AssignmentRec | null>(null);
		const [mySubmission, setMySubmission] = useState<any|null>(null);
		const [myAnswer, setMyAnswer] = useState('');
		const [myLink, setMyLink] = useState('');
		const [submissionChoice, setSubmissionChoice] = useState<'text' | 'link'>('text');
		const [submitLoading, setSubmitLoading] = useState(false);
		// Submission viewer state
		const [showSubmissionViewer, setShowSubmissionViewer] = useState(false);
		const [selectedAssignmentForViewing, setSelectedAssignmentForViewing] = useState<string | null>(null);

	const loadAssignments = async () => {
		setLoading(true); setError(null);
		try { 
			// Get all assignments across all user's classes
			const response = await api.get('/api/assignments'); 
			setAssignments(response.data); 
		} catch(e:any){ 
			setError(e.response?.data?.error || 'Load failed'); 
		} finally { 
			setLoading(false); 
		}
	};
	useEffect(() => { loadAssignments(); }, []);



	const viewSubmissions = (assignmentId: string) => {
		setSelectedAssignmentForViewing(assignmentId);
		setShowSubmissionViewer(true);
	};

		const openSubmit = async (a: AssignmentRec) => {
			setActiveAssignmentForSubmit(a); setMySubmission(null); setMyAnswer('');
			if (user?.role === 'student') {
				try { 
					const resp = await api.get(`/api/submissions/assignment/${a.id}`); 
					setMySubmission(resp.data); 
					const answers = resp.data?.answers;
					setMyAnswer(answers?.text || ''); 
					setMyLink(answers?.link || '');
				} catch { /* ignore 404 */ }
			}
		};

		const submitWork = async (e: React.FormEvent) => {
			e.preventDefault(); if (!activeAssignmentForSubmit) return; setSubmitLoading(true);
			try {
				// If existing submission, simple approach: create another? (MVP we just create new)
				const answers: any = {};
				if (activeAssignmentForSubmit.submissionType === 'text' || activeAssignmentForSubmit.submissionType === 'both') {
					if (submissionChoice === 'text' || activeAssignmentForSubmit.submissionType === 'text') {
						answers.text = myAnswer;
					}
				}
				if (activeAssignmentForSubmit.submissionType === 'link' || activeAssignmentForSubmit.submissionType === 'both') {
					if (submissionChoice === 'link' || activeAssignmentForSubmit.submissionType === 'link') {
						answers.link = myLink;
					}
				}
				const resp = await api.post(`/api/submissions/assignment/${activeAssignmentForSubmit.id}`, { answers });
				setMySubmission(resp.data);
			} finally { setSubmitLoading(false); }
		};



	return (
		<div className="page">
			<h1>Assignments</h1>
			{error && <div style={{ color:'#ff6b6b', fontSize:'.7rem' }}>{error}</div>}
			<div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
				<button onClick={loadAssignments} disabled={loading} className="btn-primary">{loading ? '...' : 'Reload'}</button>
			</div>
			<div style={{ marginTop:'1.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
				{assignments.map(a => (
					<div key={a.id} className="tile" style={{ position:'relative' }}>
						<div style={{ fontWeight:600 }}>{a.title}</div>
						<div style={{ fontSize:'.7rem', color:'#666', marginTop:'.15rem', fontWeight:500 }}>
							Class: {a.class?.name || 'Unknown Class'}
						</div>
						{a.description && <div style={{ fontSize:'.65rem', opacity:.75, marginTop:'.25rem' }}>{a.description}</div>}
						{a.dueDate && <div style={{ fontSize:'.55rem', marginTop:'.35rem', color:'#c7b8ff' }}>Due {new Date(a.dueDate).toLocaleString()}</div>}
									<div style={{ marginTop:'.5rem', display:'flex', gap:'.5rem' }}>
										{user?.role === 'teacher' && <button onClick={()=>viewSubmissions(a.id)} style={{ fontSize:'.65rem' }}>Submissions</button>}
										{user?.role === 'student' && <button onClick={()=>openSubmit(a)} className="btn-primary" style={{ fontSize:'.65rem' }}>{mySubmission && mySubmission.assignmentId === a.id ? 'View Submission' : 'Submit'}</button>}
									</div>
					</div>
				))}
			</div>
			{/* Submission Viewer Modal */}
			{showSubmissionViewer && selectedAssignmentForViewing && (
				<SubmissionViewer 
					assignmentId={selectedAssignmentForViewing}
					onClose={() => {
						setShowSubmissionViewer(false);
						setSelectedAssignmentForViewing(null);
					}}
				/>
			)}
					{activeAssignmentForSubmit && user?.role === 'student' && (
						<div style={{ marginTop:'1.5rem' }}>
							<h3 style={{ marginBottom:'.5rem' }}>Your Submission - {activeAssignmentForSubmit.title}</h3>
							<form onSubmit={submitWork} className="form-col" style={{ maxWidth:600 }}>
								{/* Submission type choice for 'both' */}
								{activeAssignmentForSubmit.submissionType === 'both' && (
									<div style={{ marginBottom: '1rem' }}>
										<label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
											Choose submission method:
										</label>
										<div style={{ display: 'flex', gap: '1rem' }}>
											<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
												<input
													type="radio"
													name="submissionChoice"
													value="text"
													checked={submissionChoice === 'text'}
													onChange={e => setSubmissionChoice(e.target.value as 'text' | 'link')}
													style={{ marginRight: '0.5rem' }}
												/>
												Text Answer
											</label>
											<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
												<input
													type="radio"
													name="submissionChoice"
													value="link"
													checked={submissionChoice === 'link'}
													onChange={e => setSubmissionChoice(e.target.value as 'text' | 'link')}
													style={{ marginRight: '0.5rem' }}
												/>
												Link/URL
											</label>
										</div>
									</div>
								)}

								{/* Text submission field */}
								{(activeAssignmentForSubmit.submissionType === 'text' || 
								  (activeAssignmentForSubmit.submissionType === 'both' && submissionChoice === 'text')) && (
									<label>Answer / Text Response
										<textarea 
											value={myAnswer} 
											onChange={e=>setMyAnswer(e.target.value)} 
											placeholder="Enter your written response here..."
											style={{ 
												background:'#f9f9f9', 
												border:'1px solid #ddd', 
												color:'#333', 
												padding:'.6rem .7rem', 
												borderRadius:6, 
												resize:'vertical', 
												minHeight:120 
											}} 
											required={activeAssignmentForSubmit.submissionType === 'text' || submissionChoice === 'text'}
										/>
									</label>
								)}

								{/* Link submission field */}
								{(activeAssignmentForSubmit.submissionType === 'link' || 
								  (activeAssignmentForSubmit.submissionType === 'both' && submissionChoice === 'link')) && (
									<label>Submission Link/URL
										<input 
											type="url"
											value={myLink} 
											onChange={e=>setMyLink(e.target.value)} 
											placeholder="https://example.com/your-work"
											style={{ 
												background:'#f9f9f9', 
												border:'1px solid #ddd', 
												color:'#333', 
												padding:'.6rem .7rem', 
												borderRadius:6
											}} 
											required={activeAssignmentForSubmit.submissionType === 'link' || submissionChoice === 'link'}
										/>
										<p style={{ fontSize: '0.75rem', color: '#666', margin: '0.25rem 0 0 0' }}>
											Provide a link to your work (Google Docs, GitHub, portfolio, etc.)
										</p>
									</label>
								)}

								<button disabled={submitLoading} className="btn-primary">{submitLoading ? 'Saving...' : (mySubmission ? 'Resubmit' : 'Submit')}</button>
								{mySubmission && <div style={{ fontSize:'.6rem', opacity:.7 }}>Submitted at {new Date(mySubmission.createdAt).toLocaleString()}</div>}
								{mySubmission?.feedback && <div style={{ marginTop:'.5rem', fontSize:'.65rem', background:'#e8f4f8', border:'1px solid #b8dce8', padding:'.5rem .6rem', borderRadius:6, color:'#2c3e50' }}><strong>Feedback:</strong><br />{mySubmission.feedback}</div>}
							</form>
						</div>
					)}
		</div>
	);
};
