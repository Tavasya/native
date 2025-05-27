import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      return;
    }

    const setupAudioContext = async () => {
      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 512; // Increased for better resolution
        analyser.smoothingTimeConstant = 0.8; // Smoother animation
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        // Setup high-DPI canvas
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;
        
        // CSS size
        const cssWidth = 120;
        const cssHeight = 60;
        
        // Set internal size to DPR-scaled pixels
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        
        // Scale down drawing coords
        ctx.scale(dpr, dpr);
        
        // Disable image smoothing for crisp bars
        ctx.imageSmoothingEnabled = false;
        
        draw();
      } catch (error) {
        console.error('Error setting up audio context:', error);
      }
    };

    setupAudioContext();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    animationRef.current = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    // Clean white background
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    const numBars = 16;
    const barWidth = 2;
    const barSpacing = 3;
    const centerX = (canvas.width / window.devicePixelRatio) / 2;
    const centerY = (canvas.height / window.devicePixelRatio) / 2;
    const totalWidth = (numBars * barWidth) + ((numBars - 1) * barSpacing);
    const startX = centerX - (totalWidth / 2);

    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor((i / numBars) * dataArray.length);
      let barHeight = (dataArray[dataIndex] / 255) * ((canvas.height / window.devicePixelRatio) / 3);
      barHeight = Math.max(barHeight, 1);

      // Snap to whole pixels
      const x = Math.floor(startX + i * (barWidth + barSpacing));

      canvasCtx.fillStyle = '#333333';
      
      // Mirror across both axes - 4 bars total
      // Top-left quadrant
      canvasCtx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      // Bottom-left quadrant  
      canvasCtx.fillRect(x, centerY, barWidth, barHeight);
      // Top-right quadrant (mirrored)
      canvasCtx.fillRect(Math.floor(centerX + (centerX - x - barWidth)), centerY - barHeight, barWidth, barHeight);
      // Bottom-right quadrant (mirrored)
      canvasCtx.fillRect(Math.floor(centerX + (centerX - x - barWidth)), centerY, barWidth, barHeight);
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      <canvas
        ref={canvasRef}
        className="rounded border border-gray-200"
      />
    </div>
  );
};

export default AudioVisualizer;