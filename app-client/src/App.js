import React, { useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';

function App() {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [width, setWidth] = useState(150);
  const [height, setHeight] = useState(150);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [overlayedVideoUrl, setOverlayedVideoUrl] = useState('');
  const [overlaying, setOverlaying] = useState(false);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);
  };

  const handleVideoChange = (e) => {
    const selectedVideo = e.target.files[0];
    setVideo(selectedVideo);

    const videoPreview = document.getElementById('videoPreview');
    if (videoPreview) {
      videoPreview.src = selectedVideo ? URL.createObjectURL(selectedVideo) : '';
    }
  };

  const handleWidthChange = (e) => {
    setWidth(parseInt(e.target.value, 10));
  };

  const handleHeightChange = (e) => {
    setHeight(parseInt(e.target.value, 10));
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('video', video);

      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageUrl(response.data.imageUrl);
      setVideoUrl(response.data.videoUrl);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleOverlay = async () => {
    try {
      setOverlaying(true);

      const formData = new FormData();
      formData.append('image', image);
      formData.append('video', video);
      formData.append('x', x);
      formData.append('y', y);
      formData.append('width', width);
      formData.append('height', height);

      const overlayedResponse = await axios.post('http://localhost:3001/overlay', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOverlayedVideoUrl(overlayedResponse.data.overlayedVideoUrl);
    } catch (error) {
      console.error('Error overlaying image on video:', error);
    } finally {
      setOverlaying(false);
    }
  };

  const handleDrag = (e, ui) => {
    setX(ui.x);
    setY(ui.y);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/download?videoUrl=${overlayedVideoUrl}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'overlayed_video.mp4');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading overlayed video:', error);
    }
  };


  return (
    <div style={{ backgroundColor: "whitesmoke" }}>
      <h1 style={{ fontSize: "2rem", margin: "10px", color: "pink", fontFamily: 'Arial, sans-serif' }}>
        IMAGE - OVERLAY  GENERATOR
      </h1>
      <div style={{ margin: "10px" }}>
        <label style={{ margin: "10px", display: 'block', color: '#333' }}>
          IMAGE:
          <input
            style={{ margin: "10px", padding: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      </div>
      <div style={{ margin: "10px" }}>
        <label style={{ margin: "10px", display: 'block', color: '#333' }}>
          VIDEO:
          <input
            style={{ margin: "10px", padding: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
          />
        </label>
      </div>
      <div style={{ margin: "10px" }}>
        <label style={{ margin: "10px", display: 'block', color: '#333' }}>
          IMAGE-WIDTH:
          <input
            style={{ margin: "10px", padding: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            type="number"
            value={width}
            onChange={handleWidthChange}
          />
        </label>
        <label style={{ margin: "10px", display: 'block', color: '#333' }}>
          IMAGE-HEIGHT:
          <input
            style={{ margin: "10px", padding: '5px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            type="number"
            value={height}
            onChange={handleHeightChange}
          />
        </label>
      </div>
      <button
        style={{
          fontSize: "1rem",
          height: "60px",
          width: "200px",
          borderRadius: "5px",
          backgroundColor: "pink",
          borderStyle: "none",
          margin: "10px",
        }}
        onClick={handleUpload}
      >
        UPLOAD
      </button>
      {videoUrl && (
        <div style={{ margin: "10px", position: 'relative' }}>
          <div style={{ position: 'relative', width: '60%', height: 'auto' }}>
            <h2>Original Video</h2>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
              <video
                id="videoPreview"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                controls
              >
                <source src={`http://localhost:3001/${videoUrl}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {image && (
                <Draggable
                  bounds="parent"
                  position={{ x, y }}
                  onDrag={handleDrag}
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Image Overlay"
                    style={{
                      position: 'absolute',
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                  />
                </Draggable>
              )}
            </div>
          </div>
        </div>
      )}
      {overlaying && <p style={{ margin: "10px", color: '#777' }}>Overlaying, please wait...</p>}
      {overlayedVideoUrl ? (
        <div style={{ margin: "10px" }}>
          <h2>Overlayed Video</h2>
          <video width='60%' height='auto' controls style={{ borderRadius: '8px' }}>
            <source src={`http://localhost:3001/${overlayedVideoUrl}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <button
            style={{
              fontSize: "1rem",
              height: "60px",
              width: "200px",
              borderRadius: "5px",
              backgroundColor: "lightGreen",
              borderStyle: "none",
              margin: "10px",
              cursor: 'pointer'
            }}
            onClick={handleDownload}
          >
            DOWNLOAD
          </button>
        </div>
      ) : (
        videoUrl && (
          <button
            style={{
              fontSize: "1rem",
              height: "60px",
              width: "200px",
              borderRadius: "5px",
              backgroundColor: "pink",
              borderStyle: "none",
              margin: "20px",
            }}
            onClick={handleOverlay}
          >
            GENERATE
          </button>
        )
      )}
    </div>
  );
}

export default App;
