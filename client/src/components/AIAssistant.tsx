import React, { useState } from 'react';
import { api } from '../lib/api';

interface AIAssistantProps {
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{type: 'question' | 'answer', text: string, timestamp: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    const currentQuestion = question.trim();
    
    // Add question to conversation
    const newQuestion = {
      type: 'question' as const,
      text: currentQuestion,
      timestamp: new Date().toLocaleTimeString()
    };
    setConversation(prev => [...prev, newQuestion]);
    setQuestion('');

    try {
      const result = await api.post('/api/ai-assistant/query', {
        question: currentQuestion
      });

      const aiResponse = {
        type: 'answer' as const,
        text: result.data.response,
        timestamp: new Date().toLocaleTimeString()
      };
      setConversation(prev => [...prev, aiResponse]);
      setResponse(result.data.response);
    } catch (error: any) {
      const errorResponse = {
        type: 'answer' as const,
        text: `Sorry, I encountered an error: ${error.response?.data?.error || 'Unable to process your question right now.'}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What assignments are due this week?",
    "What's my current grade in each class?",
    "What assignments haven't I submitted yet?",
    "What do I need to score on my next assignment to get an A?",
    "Show me my upcoming deadlines",
    "Calculate my GPA"
  ];

  const handleQuickQuestion = (quickQ: string) => {
    setQuestion(quickQ);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e1e6ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🤖</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Academic Assistant</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Ask about assignments, grades, and academic planning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Conversation Area */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflow: 'auto',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {conversation.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666',
              padding: '2rem',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>How can I help you today?</h3>
              <p style={{ margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                I can help you with upcoming assignments, grade calculations, deadlines, and academic planning.
              </p>
              
              <div style={{ marginTop: '2rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>Try asking:</p>
                <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
                  {quickQuestions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(q)}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #e1e6ef',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        color: '#555',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#667eea';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e1e6ef';
                      }}
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {conversation.map((item, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: item.type === 'question' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: item.type === 'question' ? '#667eea' : '#f8f9fa',
                    color: item.type === 'question' ? 'white' : '#333',
                    fontSize: '0.9rem',
                    lineHeight: 1.4
                  }}>
                    <div>{item.text}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.7,
                      marginTop: '0.25rem'
                    }}>
                      {item.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#666',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e1e6ef',
                borderTop: '2px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              AI is thinking...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e1e6ef',
          background: '#f8f9fa'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me about your assignments, grades, or deadlines..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  maxHeight: '120px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !question.trim() ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                minWidth: '80px',
                height: '45px'
              }}
            >
              {loading ? '...' : 'Ask'}
            </button>
          </form>
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.75rem',
            color: '#666',
            textAlign: 'center'
          }}>
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};