import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Send, Mic, Square, CheckCircle, RefreshCw } from 'lucide-react';

const Learn = () => {
  const { user, setUser } = useContext(AuthContext);
  const [skillFocus, setSkillFocus] = useState('Mixed');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Evaluation
  const [evaluation, setEvaluation] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const startNewSession = () => {
    setConversationId(null);
    setMessages([]);
    setEvaluation(null);
    setInputText('');
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const endpoint = conversationId 
        ? `/api/chat/${conversationId}/message` 
        : `/api/chat/message`;
      
      const res = await axios.post(endpoint, {
        content: userMessage.content,
        skillFocus
      });

      if (!conversationId) {
        setConversationId(res.data.conversationId);
      }

      setMessages(res.data.messages);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الرسالة.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = handleVoiceUpload;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('الرجاء السماح بالوصول إلى الميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleVoiceUpload = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('skillFocus', skillFocus);

    setLoading(true);

    try {
      const endpoint = conversationId 
        ? `/api/chat/${conversationId}/voice` 
        : `/api/chat/voice`;

      const res = await axios.post(endpoint, formData, {
        responseType: 'blob', // We expect audio back
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newConversationId = res.headers['x-conversation-id'];
      const replyText = decodeURIComponent(res.headers['x-reply-text']);
      const userText = decodeURIComponent(res.headers['x-user-text']);

      if (!conversationId && newConversationId) {
        setConversationId(newConversationId);
      }

      // Add to UI
      setMessages((prev) => [
        ...prev, 
        { role: 'user', content: userText },
        { role: 'assistant', content: replyText }
      ]);

      // Play audio
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      audio.play();

    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء معالجة الصوت.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/chat/${conversationId}/evaluate`);
      setEvaluation(res.data.evaluation);
      // Update user context with new CEFR if needed
      if (res.data.evaluation.overallCEFR) {
        setUser({ ...user, currentLevel: res.data.evaluation.overallCEFR });
      }
    } catch (error) {
      console.error(error);
      alert('فشل التقييم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="learn-container">
      {!evaluation ? (
        <>
          <div className="learn-header">
            <h2>مساحة التعلم</h2>
            <div className="skill-selector">
              <label>التركيز على المهارة:</label>
              <select 
                value={skillFocus} 
                onChange={(e) => setSkillFocus(e.target.value)}
                disabled={messages.length > 0}
                className="select-input"
              >
                <option value="Mixed">متنوع (Mixed)</option>
                <option value="Writing">الكتابة (Writing)</option>
                <option value="Reading">القراءة (Reading)</option>
                <option value="Speaking">المحادثة (Speaking)</option>
                <option value="Listening">الاستماع (Listening)</option>
              </select>
            </div>
            {messages.length > 0 && (
              <button onClick={handleEvaluate} className="btn-evaluate" disabled={loading}>
                <CheckCircle size={18} /> إنهاء وتقييم
              </button>
            )}
          </div>

          <div className="chat-box glass-panel">
            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>اختر المهارة وابدأ المحادثة أو قم بتسجيل صوتك.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.role}`}>
                    <div className="message-content" dir="ltr">{msg.content}</div>
                  </div>
                ))
              )}
              {loading && (
                <div className="message-bubble assistant typing">
                  <div className="dot-typing"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <form onSubmit={handleSendText} className="input-form">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="اكتب رسالتك بالإنجليزية..."
                  disabled={loading || isRecording}
                  dir="ltr"
                />
                <button type="submit" className="btn-send" disabled={loading || isRecording || !inputText.trim()}>
                  <Send size={20} />
                </button>
              </form>

              <button 
                className={`btn-voice ${isRecording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={loading}
                title="اضغط مطولاً للتسجيل"
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="evaluation-card glass-panel">
          <h2>نتيجة التقييم</h2>
          <div className="cefr-result">
            <span className="cefr-large">{evaluation.overallCEFR}</span>
            <span className="cefr-label">المستوى العام</span>
          </div>
          
          <p className="feedback-text">{evaluation.feedback}</p>
          
          <div className="scores-grid">
            <div className="score-item">
              <span className="score-label">الكتابة</span>
              <span className="score-value">{evaluation.writingScore}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">القراءة</span>
              <span className="score-value">{evaluation.readingScore}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">الاستماع</span>
              <span className="score-value">{evaluation.listeningScore}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">المحادثة</span>
              <span className="score-value">{evaluation.speakingScore}%</span>
            </div>
          </div>

          <button onClick={startNewSession} className="btn-primary" style={{marginTop: '2rem'}}>
            <RefreshCw size={18} style={{marginRight: '8px'}} />
            بدء جلسة جديدة
          </button>
        </div>
      )}
    </div>
  );
};

export default Learn;
