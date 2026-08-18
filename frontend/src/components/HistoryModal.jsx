import React from "react";

export default function HistoryModal({ history, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h3>My Analysis History</h3>
        
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Skin Type</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td><strong>{row.type}</strong></td>
                <td><span className="badge-pill">{row.confidence}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}