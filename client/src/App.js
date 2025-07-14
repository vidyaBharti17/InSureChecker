import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleAuthSubmit = async (event) => {
  event.preventDefault();
  const url = isRegistering ? '/register' : '/login';
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await axios.post(`http://localhost:5000${url}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    setMessage(response.data);
    if (!isRegistering) window.location.href = '/upload_page'; // Redirect after login
  } catch (error) {
    setMessage('Error: ' + (error.response?.data || error.message));
  }
};

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
      <div>
        <button onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}>
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
        <form onSubmit={handleAuthSubmit}>
          <label>Username: <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} /></label><br />
          <label>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><br />
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        </form>
        {message && <p>{message}</p>}
      </div>
      {/* {current_user && ( // Replace with actual login check logic later */}
      <div>
        <form onSubmit={handleSubmit}>
          <label>
            Upload Medical Report:
            <input type="file" onChange={handleFileChange} />
          </label>
          <br />
          <button type="submit" disabled={loading}>Upload{loading && '...'}</button>
        </form>
        {file && <p>Selected file: {file.name}</p>}
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
      {/* )} */}
    </div>
  );
}

export default App;