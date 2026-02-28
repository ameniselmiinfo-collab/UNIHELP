import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:3001/api";

const SUBJECTS = [
  { id: "inscriptions", icon: "📋", title: "Inscriptions", color: "#1a4fa0" },
  { id: "attestations", icon: "📄", title: "Attestations", color: "#0d6e4a" },
  { id: "bourses", icon: "🎓", title: "Bourses", color: "#6b2d8b" },
  { id: "absences", icon: "📅", title: "Absences", color: "#a04010" },
  { id: "stages", icon: "🏢", title: "Stages", color: "#0a6080" },
  { id: "courriers", icon: "✉️", title: "Courriers", color: "#3d3d3d" }
];

const QUICK_QUESTIONS = {
  inscriptions: ["Documents requis", "Frais d'inscription", "Dates limites", "Procédure"],
  attestations: ["Attestation de scolarité", "Relevé de notes", "Diplôme original", "Attestation provisoire"],
  bourse: ["Bourse sociale", "Bourse excellence", "Aides CROUS"],
  absences: ["Taux d'absence", "Justificatif", "Session rattrapage"],
  stages: ["Convention de stage", "Durée du stage", "Rapport de stage"],
  courriers: ["Demande attestation", "Demande bourse", "Réclamation notes"]
};

function Message({ msg, color }) {
  const isUser = msg.role === "user";
  let mainText = msg.content;
  let courrier = null;

  if (!isUser) {
    const m = msg.content.match(/\[COURRIER\]([\s\S]*?)\[\/COURRIER\]/);
    if (m) {
      courrier = m[1].trim();
      mainText = msg.content.replace(/\[COURRIER\][\s\S]*?\[\/COURRIER\]/, "").trim();
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexDirection: isUser ? "row-reverse" : "row" }}>
      {!isUser && (
        <div style={{ width: "36px", height: "36px", background: color || "#1a4fa0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          🎓
        </div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ background: isUser ? "#0084ff" : "#e9e9e9", color: isUser ? "#fff" : "#333", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", fontSize: "14px", lineHeight: "1.5" }}>
          {mainText}
          {msg.loading && <span style={{ opacity: 0.5 }}> ...</span>}
        </div>
        {courrier && (
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ background: "#f5f5f5", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#333" }}>📄 Courrier généré</span>
              <button onClick={() => navigator.clipboard.writeText(courrier)} style={{ background: "#0084ff", border: "none", borderRadius: "4px", color: "white", fontSize: "11px", padding: "4px 10px", cursor: "pointer" }}>
                Copier
              </button>
            </div>
            <pre style={{ padding: "12px", fontSize: "12px", lineHeight: "1.5", color: "#333", whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>{courrier}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSubjects, setShowSubjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const getSubjectColor = () => SUBJECTS.find(s => s.id === selectedSubject)?.color || "#1a4fa0";

  const selectSubject = (subjectId) => {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    setSelectedSubject(subjectId);
    setShowSubjects(false);
    setHistory([]);
    setMessages([{ role: "assistant", content: `Bienvenue dans le service "${subject?.title}" ! 👋\n\nJe suis à votre disposition pour répondre à vos questions. Cliquez sur une question ci-dessous ou posez votre propre question.` }]);
  };

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q) return;
    
    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const newHistory = [...history, { role: "user", content: q }];
    
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history: newHistory })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      setHistory([...newHistory, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, je rencontre actuellement des difficultés. Veuillez réessayer ou contacter le secrétariat au 71 000 001." }]);
    }
    setLoading(false);
  };

  const handleQuickReply = (question) => sendMessage(question);

  const goBack = () => {
    setSelectedSubject(null);
    setMessages([]);
    setHistory([]);
    setShowSubjects(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto", background: "#fff", minHeight: "100vh", boxShadow: "0 0 30px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: selectedSubject ? getSubjectColor() : "#1a4fa0", color: "white", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
          {selectedSubject && (
            <button onClick={goBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "white", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ←
            </button>
          )}
          <div style={{ fontSize: "24px" }}>{selectedSubject ? SUBJECTS.find(s => s.id === selectedSubject)?.icon : "🏛️"}</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>{selectedSubject ? SUBJECTS.find(s => s.id === selectedSubject)?.title : "UniHelp"}</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>{selectedSubject ? "Assistant virtuel" : "Assistant universitaire"}</div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", paddingBottom: "100px" }}>
          {showSubjects && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h1 style={{ fontSize: "26px", color: "#333", marginBottom: "8px", textAlign: "center", fontWeight: 700 }}>Bienvenue ! 👋</h1>
              <p style={{ color: "#666", marginBottom: "24px", textAlign: "center" }}>Je suis l'assistant virtuel de l'Université Centrale de Tunis</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                {SUBJECTS.map(subject => (
                  <button key={subject.id} onClick={() => selectSubject(subject.id)} style={{ background: "white", border: `2px solid ${subject.color}30`, borderRadius: "16px", padding: "24px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    <span style={{ fontSize: "36px" }}>{subject.icon}</span>
                    <span style={{ color: subject.color, fontWeight: "600", fontSize: "15px" }}>{subject.title}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "32px", padding: "16px", background: "#f8f9fa", borderRadius: "12px", textAlign: "center" }}>
                <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>💡 <strong>Conseil :</strong> Sélectionnez un service pour obtenir des réponses personnalisées</p>
              </div>
            </div>
          )}

          {selectedSubject && !showSubjects && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div>
                {messages.map((msg, i) => <Message key={i} msg={msg} color={getSubjectColor()} />)}
                <div ref={endRef} />
              </div>
              {messages.length > 0 && !loading && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "12px" }}>
                  <span style={{ width: "100%", fontSize: "12px", color: "#666", marginBottom: "4px" }}>Questions fréquentes :</span>
                  {(QUICK_QUESTIONS[selectedSubject] || []).map((q, i) => (
                    <button key={i} onClick={() => handleQuickReply(q)} style={{ background: "white", border: `1px solid ${getSubjectColor()}40`, borderRadius: "20px", padding: "8px 14px", fontSize: "12px", color: getSubjectColor(), cursor: "pointer", transition: "all 0.2s" }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", padding: "16px 20px", boxShadow: "0 -2px 10px rgba(0,0,0,0.1)", borderTop: "1px solid #eee" }}>
                <div style={{ maxWidth: "420px", margin: "0 auto", display: "flex", gap: "10px" }}>
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()} placeholder="Tapez votre question..." disabled={loading} style={{ flex: 1, padding: "14px 18px", borderRadius: "24px", border: "1px solid #ddd", fontSize: "14px", outline: "none", background: loading ? "#f5f5f5" : "white" }} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? getSubjectColor() : "#ccc", color: "white", border: "none", borderRadius: "50%", width: "48px", height: "48px", cursor: input.trim() && !loading ? "pointer" : "default", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {loading ? "..." : "➤"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } body { margin: 0; padding: 0; } * { box-sizing: border-box; }`}</style>
      </div>
    </div>
  );
}
