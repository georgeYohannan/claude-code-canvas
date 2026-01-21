'use client';

import { useState, useCallback } from 'react';

type FormData = {
  productName: string;
  productImageUrl: string;
  productAvatar: string;
  productFeatures: string;
  videoSetting: string;
};

type Status = 'idle' | 'uploading' | 'generating' | 'complete' | 'error';

const IMGBB_API_KEY = 'c46843b78d3b87ca9641965feec17fe7';
const API_ENDPOINT = '/api/ugc';

export default function UGCVideoGenerator() {
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productImageUrl: '',
    productAvatar: '',
    productFeatures: '',
    videoSetting: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');

    const data = await response.json();
    return data.data.url;
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setStatus('uploading');
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({ ...prev, productImageUrl: url }));
      setStatus('idle');
    } catch {
      setError('Failed to upload image. Please try again.');
      setStatus('error');
      setPreviewImage('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productImageUrl) {
      setError('Please upload a product image');
      return;
    }

    setStatus('generating');
    setError('');
    setVideoUrl('');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate video');

      const data = await response.json();

      if (data.success && data.video_url) {
        setVideoUrl(data.video_url);
        setStatus('complete');
      } else {
        throw new Error(data.error || 'Video generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      productImageUrl: '',
      productAvatar: '',
      productFeatures: '',
      videoSetting: '',
    });
    setStatus('idle');
    setVideoUrl('');
    setError('');
    setPreviewImage('');
  };

  return (
    <div className="ugc-container">
      {/* Film grain overlay */}
      <div className="film-grain" />

      {/* Sprocket decoration */}
      <div className="sprocket-left" />
      <div className="sprocket-right" />

      <header className="ugc-header">
        <div className="header-badge">STUDIO</div>
        <h1 className="header-title">UGC Video Generator</h1>
        <p className="header-subtitle">AI-Powered Product Videos in Minutes</p>
      </header>

      <main className="ugc-main">
        {status === 'complete' && videoUrl ? (
          <div className="result-panel">
            <div className="result-badge">RENDER COMPLETE</div>
            <div className="video-container">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="result-video"
              />
            </div>
            <div className="result-actions">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <span className="btn-icon">↓</span>
                Download Video
              </a>
              <button onClick={resetForm} className="btn-secondary">
                Create Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ugc-form">
            {/* Image Upload Zone */}
            <div className="form-section">
              <label className="section-label">
                <span className="label-number">01</span>
                Product Image
              </label>
              <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''} ${previewImage ? 'has-image' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                {previewImage ? (
                  <div className="preview-container">
                    <img src={previewImage} alt="Product preview" className="preview-image" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        setPreviewImage('');
                        setFormData(prev => ({ ...prev, productImageUrl: '' }));
                      }}
                    >
                      ×
                    </button>
                    {status === 'uploading' && (
                      <div className="upload-progress">
                        <div className="progress-spinner" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    <div className="upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 16v4h16v-4M12 4v12M7 9l5-5 5 5" />
                      </svg>
                    </div>
                    <span className="upload-text">Drop image or click to browse</span>
                    <span className="upload-hint">PNG, JPG up to 10MB</span>
                  </label>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="form-section">
              <label className="section-label">
                <span className="label-number">02</span>
                Product Details
              </label>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Product name (e.g., Professional Lip Color)"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  required
                  className="form-input"
                />
                <textarea
                  placeholder="Key features (e.g., Hydrating formula, natural ingredients, long-lasting)"
                  value={formData.productFeatures}
                  onChange={(e) => setFormData(prev => ({ ...prev, productFeatures: e.target.value }))}
                  required
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            {/* Video Configuration */}
            <div className="form-section">
              <label className="section-label">
                <span className="label-number">03</span>
                Video Configuration
              </label>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Ideal customer (e.g., Young woman in her twenties, casual style)"
                  value={formData.productAvatar}
                  onChange={(e) => setFormData(prev => ({ ...prev, productAvatar: e.target.value }))}
                  required
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Video setting (e.g., Bright bathroom, morning routine)"
                  value={formData.videoSetting}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoSetting: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'generating' || status === 'uploading'}
              className="submit-btn"
            >
              {status === 'generating' ? (
                <>
                  <span className="generating-icon" />
                  Generating Video...
                </>
              ) : (
                <>
                  <span className="submit-icon">▶</span>
                  Generate UGC Video
                </>
              )}
            </button>

            {status === 'generating' && (
              <div className="generating-status">
                <div className="status-bar">
                  <div className="status-progress" />
                </div>
                <p className="status-text">
                  Creating your video with AI magic. This typically takes 2-4 minutes...
                </p>
                <div className="status-steps">
                  <span className="step active">Analyzing product</span>
                  <span className="step-arrow">→</span>
                  <span className="step">Creating scene</span>
                  <span className="step-arrow">→</span>
                  <span className="step">Rendering video</span>
                </div>
              </div>
            )}
          </form>
        )}
      </main>

      <footer className="ugc-footer">
        <span>Powered by n8n + Veo 3.1</span>
      </footer>

      <style jsx>{`
        .ugc-container {
          min-height: 100vh;
          background: #0a0a0b;
          color: #e8e6e3;
          position: relative;
          overflow-x: hidden;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Film grain effect */
        .film-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          z-index: 1000;
        }

        /* Sprocket decorations */
        .sprocket-left,
        .sprocket-right {
          position: fixed;
          top: 0;
          bottom: 0;
          width: 24px;
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 20px,
            #1a1a1c 20px,
            #1a1a1c 24px,
            transparent 24px,
            transparent 44px
          );
          z-index: 10;
        }
        .sprocket-left { left: 0; border-right: 2px solid #1a1a1c; }
        .sprocket-right { right: 0; border-left: 2px solid #1a1a1c; }

        /* Header */
        .ugc-header {
          text-align: center;
          padding: 60px 24px 40px;
          position: relative;
        }

        .header-badge {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(135deg, #d4a853 0%, #b8860b 100%);
          color: #0a0a0b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          border-radius: 2px;
          margin-bottom: 20px;
        }

        .header-title {
          font-size: clamp(32px, 6vw, 48px);
          font-weight: 300;
          letter-spacing: -1px;
          margin: 0 0 12px;
          background: linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-subtitle {
          font-size: 15px;
          color: #6b6b6b;
          margin: 0;
          font-weight: 400;
        }

        /* Main content */
        .ugc-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Form */
        .ugc-form {
          background: linear-gradient(180deg, #141416 0%, #0f0f10 100%);
          border: 1px solid #2a2a2c;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        }

        .form-section {
          margin-bottom: 32px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
          margin-bottom: 16px;
        }

        .label-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #d4a853;
          color: #0a0a0b;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }

        /* Upload zone */
        .upload-zone {
          border: 2px dashed #2a2a2c;
          border-radius: 8px;
          transition: all 0.2s ease;
          background: #0d0d0e;
          overflow: hidden;
        }

        .upload-zone.drag-active {
          border-color: #d4a853;
          background: rgba(212, 168, 83, 0.05);
        }

        .upload-zone.has-image {
          border-style: solid;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-label:hover {
          background: rgba(212, 168, 83, 0.03);
        }

        .file-input {
          display: none;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          color: #4a4a4a;
          margin-bottom: 16px;
        }

        .upload-text {
          font-size: 15px;
          color: #888;
          margin-bottom: 8px;
        }

        .upload-hint {
          font-size: 12px;
          color: #555;
        }

        .preview-container {
          position: relative;
          aspect-ratio: 1;
          max-height: 300px;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #0a0a0b;
        }

        .remove-image {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid #333;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-image:hover {
          background: #d4a853;
          color: #0a0a0b;
        }

        .upload-progress {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: #d4a853;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Input styles */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 16px;
          background: #0d0d0e;
          border: 1px solid #2a2a2c;
          border-radius: 6px;
          color: #e8e6e3;
          font-size: 15px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #d4a853;
          box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #4a4a4a;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Error message */
        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 6px;
          color: #f87171;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #d4a853 0%, #b8860b 100%);
          border: none;
          border-radius: 6px;
          color: #0a0a0b;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 168, 83, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-icon {
          font-size: 12px;
        }

        .generating-icon {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(10, 10, 11, 0.3);
          border-top-color: #0a0a0b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Generating status */
        .generating-status {
          margin-top: 24px;
          padding: 24px;
          background: #0d0d0e;
          border: 1px solid #2a2a2c;
          border-radius: 8px;
        }

        .status-bar {
          height: 4px;
          background: #1a1a1c;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .status-progress {
          height: 100%;
          width: 30%;
          background: linear-gradient(90deg, #d4a853, #b8860b);
          border-radius: 2px;
          animation: progress 2s ease-in-out infinite;
        }

        .status-text {
          font-size: 14px;
          color: #888;
          margin: 0 0 16px;
        }

        .status-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #555;
        }

        .step {
          padding: 4px 8px;
          background: #1a1a1c;
          border-radius: 4px;
        }

        .step.active {
          background: rgba(212, 168, 83, 0.2);
          color: #d4a853;
        }

        .step-arrow {
          color: #333;
        }

        /* Result panel */
        .result-panel {
          background: linear-gradient(180deg, #141416 0%, #0f0f10 100%);
          border: 1px solid #2a2a2c;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
        }

        .result-badge {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          border-radius: 2px;
          margin-bottom: 24px;
        }

        .video-container {
          background: #0a0a0b;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .result-video {
          width: 100%;
          max-height: 400px;
          display: block;
        }

        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #d4a853 0%, #b8860b 100%);
          color: #0a0a0b;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 168, 83, 0.3);
        }

        .btn-icon {
          font-size: 16px;
        }

        .btn-secondary {
          padding: 14px 28px;
          background: transparent;
          border: 1px solid #2a2a2c;
          color: #888;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          border-color: #d4a853;
          color: #d4a853;
        }

        /* Footer */
        .ugc-footer {
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: #444;
          letter-spacing: 1px;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes progress {
          0% { width: 10%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 10%; margin-left: 90%; }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .sprocket-left,
          .sprocket-right {
            display: none;
          }

          .ugc-form {
            padding: 24px 20px;
          }

          .result-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
