import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../state/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'teacher';
  
  const getWelcomeMessage = () => {
    if (isTeacher) {
      return 'Hello! I\'m your AI teaching assistant. I can help you with:\n\n• 👥 Student performance analysis\n• 📊 Identifying struggling or top students\n• � Class performance insights and trends\n• 🎯 Teaching strategies and interventions\n• � Grade analysis and interpretation\n• 🔍 Student engagement insights\n\nWhat would you like assistance with today?';
    } else {
      return 'Hello! I\'m your AI assistant. I can help you with:\n\n• 📅 Upcoming assignments and deadlines\n• 📊 Grade analysis and predictions\n• 📝 Study planning and tips\n• ❓ General academic questions\n\nWhat would you like to know?';
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/ai-assistant/query', {
        question: input.trim()
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = isTeacher ? [
    "Show me my lowest scoring students",
    "Which students need extra help?",
    "Analyze my class performance trends",
    "Compare performance across assignments",
    "Identify students with missing submissions",
    "Suggest strategies for struggling students"
  ] : [
    "What assignments do I have coming up?",
    "How can I improve my grades?",
    "What's my current GPA?",
    "When are my next deadlines?",
    "Help me plan my study schedule"
  ];

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🤖</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>AI {isTeacher ? 'Teaching' : ''} Assistant</h1>
              <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                Your {isTeacher ? 'intelligent teaching' : 'personal academic'} assistant powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '1rem 1.5rem',
                    borderRadius: message.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                      : '#f8f9fa',
                    color: message.role === 'user' ? 'white' : '#333',
                    border: message.role === 'assistant' ? '1px solid #e9ecef' : 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {message.role === 'assistant' && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🤖 AI Assistant
                    </div>
                  )}
                  {message.content}
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    marginTop: '0.5rem',
                    textAlign: message.role === 'user' ? 'right' : 'left'
                  }}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '20px 20px 20px 5px',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  color: '#666'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🤖 AI Assistant
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    Thinking... 💭
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e9ecef',
              background: '#f8f9fa'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem' }}>
                Quick questions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#2196f3';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #e9ecef',
            background: 'white'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your academics..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: '2px solid #e1e6ef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  resize: 'none',
                  minHeight: '60px',
                  maxHeight: '120px',
                  fontFamily: 'inherit'
                }}
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: '1rem 2rem',
                  background: loading || !input.trim() ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px'
                }}
              >
                {loading ? '⏳' : '📤 Send'}
              </button>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#666',
              marginTop: '0.75rem',
              textAlign: 'center'
            }}>
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>What I can help you with:</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {isTeacher ? (
              <>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>�</div>
                  <strong>Student Analysis</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Identify struggling students, track performance trends, and get insights on class progress
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                  <strong>Teaching Strategies</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Get personalized teaching recommendations and intervention strategies for your students
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                  <strong>Performance Insights</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Analyze class averages, grade distributions, and assignment effectiveness
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>�📅</div>
                  <strong>Assignment Tracking</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Get information about upcoming assignments, deadlines, and submission status
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                  <strong>Grade Analysis</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Analyze your current grades and get predictions for future performance
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
                  <strong>Study Planning</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Get personalized study tips and help planning your academic schedule
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};