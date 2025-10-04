import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [speechText, setSpeechText] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [videoSubtitles, setVideoSubtitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const handleSpeechToText = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('audio_file', file);

    try {
      const response = await fetch('http://localhost:8000/speech-to-text/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSpeechText(data.text || data.error);
    } catch (error) {
      setSpeechText('Error processing audio');
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        handleSpeechToText({ target: { files: [file] } });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!ttsText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/text-to-speech/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.play();
    } catch (error) {
      console.error('Error generating speech:', error);
    }
    setLoading(false);
  };

  const handleImageToAudio = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image_file', file);

    try {
      const response = await fetch('http://localhost:8000/image-to-audio/', {
        method: 'POST',
        body: formData,
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.play();
    } catch (error) {
      console.error('Error generating audio description:', error);
    }
    setLoading(false);
  };

  const handleGenerateSubtitles = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('video_file', file);

    try {
      const response = await fetch('http://localhost:8000/generate-subtitles/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setVideoSubtitles([{ text: `Error: ${data.error}` }]);
      } else {
        setVideoSubtitles(data.subtitles || []);
      }
    } catch (error) {
      console.error('Error generating subtitles:', error);
      setVideoSubtitles([{ text: 'Error generating subtitles' }]);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>InclusiveAI Hub</h1>
      </header>

      <section className="tool-section speech-to-text">
        <h2>Speech to Text</h2>
        <p>Convert speech audio to text.</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {isRecording ? (
            <button onClick={stopRecording} disabled={loading} style={{ flex: 1 }}>Stop Recording</button>
          ) : (
            <button onClick={startRecording} disabled={loading} style={{ flex: 1 }}>Live Recorder</button>
          )}
          <button onClick={() => fileInputRef.current.click()} disabled={loading} style={{ flex: 1, fontSize: '24px', padding: '10px' }}>+</button>
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleSpeechToText} style={{ display: 'none' }} />
        <textarea
          placeholder="Speech to text output will appear here..."
          value={speechText}
          readOnly
        />
      </section>

      <section className="tool-section text-to-speech">
        <h2>Text to Speech</h2>
        <p>Convert text to speech audio.</p>
        <textarea
          placeholder="Enter text to convert to speech"
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
        />
        <button onClick={handleTextToSpeech} disabled={loading}>Play Speech</button>
      </section>

      <section className="tool-section image-to-audio">
        <h2>Image to Audio Description</h2>
        <p>Upload an image to get audio description.</p>
        <input type="file" accept="image/*" onChange={handleImageToAudio} />
        <button onClick={() => audioRef.current && audioRef.current.play()}>Play Description</button>
      </section>

      <section className="tool-section real-time-subtitles">
        <h2>Real-time Subtitle Generator</h2>
        <p>Upload video to get real-time subtitles.</p>
        <input type="file" accept="video/*" onChange={handleGenerateSubtitles} />
        <div className="subtitles">
          {videoSubtitles.map((sub, index) => (
            <p key={index}>{sub.text}</p>
          ))}
        </div>
      </section>

      <audio ref={audioRef} controls style={{ display: 'none' }} />
      {loading && <div className="loading">Processing...</div>}
    </div>
  );
}

export default App;
