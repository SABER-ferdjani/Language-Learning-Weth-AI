import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Award, Calendar, Activity, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, activityRes] = await Promise.all([
          axios.get('/api/history'),
          axios.get('/api/history/activity')
        ]);
        setSessions(sessionsRes.data);
        setActivity(activityRes.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const loadSessionDetails = async (id) => {
    try {
      const res = await axios.get(`/api/history/${id}`);
      setSelectedSession(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="history-container">
      <div className="summary-section">
        <div className="summary-card glass-panel">
          <Award className="summary-icon" size={40} />
          <div className="summary-info">
            <h3>المستوى العام الحالي</h3>
            <span className="cefr-massive">{user?.currentLevel}</span>
          </div>
        </div>

        <div className="summary-card glass-panel activity-card">
          <div className="activity-header">
            <Activity className="summary-icon" size={24} />
            <h3>النشاط اليومي</h3>
          </div>
          <div className="activity-bars">
            {activity.slice(-7).map((day, idx) => (
              <div key={idx} className="activity-bar-container" title={`${day._id}: ${day.count} جلسات`}>
                <div 
                  className="activity-bar" 
                  style={{ height: `${Math.min(day.count * 20, 100)}%` }}
                ></div>
                <span className="activity-day">{new Date(day._id).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sessions-section glass-panel">
        <div className="sessions-header">
          <Calendar size={24} />
          <h2>الجلسات السابقة</h2>
        </div>

        {!selectedSession ? (
          <div className="sessions-list">
            {sessions.length === 0 ? (
              <p className="empty-text">لا توجد جلسات سابقة بعد.</p>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session._id} 
                  className="session-item"
                  onClick={() => loadSessionDetails(session._id)}
                >
                  <div className="session-info">
                    <span className="session-date">
                      {format(new Date(session.startedAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                    <span className="session-focus">المهارة: {session.skillFocus}</span>
                  </div>
                  {session.isCompleted ? (
                    <span className="session-badge cefr">{session.evaluation?.overallCEFR || 'تم'}</span>
                  ) : (
                    <span className="session-badge pending">غير مكتمل</span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="session-details">
            <button className="btn-back" onClick={() => setSelectedSession(null)}>
              <ChevronLeft size={20} /> عودة للقائمة
            </button>
            
            <div className="transcript-box">
              {selectedSession.messages.map((msg, index) => (
                <div key={index} className={`message-bubble ${msg.role}`}>
                  <div className="message-content" dir="ltr">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
