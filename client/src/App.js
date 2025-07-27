import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
    setExtractedText('');
    setEligibility('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data);
      const lines = response.data.split('\n');
      const textLine = lines.find(line => line.startsWith('Extracted text:'));
      const eligibilityLine = lines.find(line => line.startsWith('Eligibility:'));
      setExtractedText(textLine ? textLine.replace('Extracted text: ', '') : '');
      setEligibility(eligibilityLine ? eligibilityLine.replace('Eligibility: ', '') : '');
    } catch (error) {
      setMessage('Error uploading file: ' + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
    <p style={{ color: '#7f8c8d', fontSize: '1em' }}>A tool to process medical reports and determine claim eligibility.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Upload Medical Report:
          <input type="file" onChange={handleFileChange} />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          Upload{loading && '...'}
        </button>
      </form>
      {file && <p>Selected file: {file.name}</p>}
      {message && (
        <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>
      )}
      {extractedText && (
        <div>
          <h3>Extracted Text:</h3>
          <pre>{extractedText}</pre>
        </div>
      )}
      {eligibility && (
        <div>
          <h3>Eligibility Status:</h3>
          <p>{eligibility}</p>
        </div>
      )}
    </div>
  );
}

export default App;