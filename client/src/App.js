import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import History from './History';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        withCredentials: true, // For session handling
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
    try {
      const response = await axios.post(`http://localhost:5000${url}`, {
        username,
        password,
      }, { withCredentials: true });
      setMessage(response.data);
      if (!isRegistering) {
        setIsAuthenticated(true);
        setMessage(''); // Clear message after successful login
      }
    } catch (error) {
      setMessage('Error: ' + (error.response?.data || error.message));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/logout', { withCredentials: true });
      setIsAuthenticated(false);
      setMessage('Logged out');
      setFile(null);
      setExtractedText('');
      setEligibility('');
    } catch (error) {
      setMessage('Error logging out: ' + error.message);
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
      {isAuthenticated && (
        <div>
          <form onSubmit={handleSubmit}>
            <label>
              Upload Medical Report:
              <input type="file" onChange={handleFileChange} />
            </label>
            <br />
            <button type="submit" disabled={loading}>Upload{loading && '...'}</button>
            <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
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
          <History />
        </div>
      )}
    </div>
  );
}

export default App;