import React, { useState, useEffect } from 'react';
import axios from 'axios';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/history', {
          withCredentials: true, // For session handling
        });
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <p>Loading history...</p>;

  return (
    <div>
      <h2>Upload History</h2>
      {history.length === 0 ? (
        <p>No history available.</p>
      ) : (
        <ul>
          {history.map((item, index) => (
            <li key={index}>
              <strong>Filename:</strong> {item.filename}<br />
              <strong>Extracted Text:</strong> <pre>{item.extracted_text}</pre><br />
              <strong>Eligibility:</strong> {item.eligibility}<br />
              <strong>Date:</strong> {new Date(item.process_date).toLocaleString()}<br />
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;