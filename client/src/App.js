import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage(''); // Clear previous message
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data);
    } catch (error) {
      setMessage('Error uploading file: ' + (error.response?.data || error.message));
    }
  };

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Upload Medical Report:
          <input type="file" onChange={handleFileChange} />
        </label>
        <br />
        <button type="submit">Upload</button>
      </form>
      {file && <p>Selected file: {file.name}</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
