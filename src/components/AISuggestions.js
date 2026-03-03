import { useState } from "react";

function AISuggestions() {
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      product: "Rice",
      currentStock: 5,
      suggested: 70,
      reason: "Based on last 30 days average sales"
    },
    {
      id: 2,
      product: "Sugar",
      currentStock: 3,
      suggested: 50,
      reason: "High weekly consumption trend"
    }
  ]);

  const handleApprove = (id) => {
    setSuggestions(suggestions.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    setSuggestions(suggestions.filter(item => item.id !== id));
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>🤖 AI Reorder Suggestions</h2>

      {suggestions.length === 0 && <p>No pending suggestions 🎉</p>}

      {suggestions.map((item) => (
        <div key={item.id} style={{
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "15px",
          backgroundColor: "#ffffff"
        }}>
          <h3>{item.product}</h3>
          <p>Current Stock: {item.currentStock}</p>
          <p>Suggested Order: {item.suggested} units</p>
          <p style={{ fontSize: "12px", color: "gray" }}>
            {item.reason}
          </p>

          <button
            onClick={() => handleApprove(item.id)}
            style={{
              padding: "6px 12px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "4px"
            }}
          >
            Approve
          </button>

          <button
            onClick={() => handleReject(item.id)}
            style={{
              padding: "6px 12px",
              marginLeft: "10px",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "4px"
            }}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}

export default AISuggestions;