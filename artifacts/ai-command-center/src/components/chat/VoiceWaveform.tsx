/**
 * @file        artifacts/ai-command-center/src/components/chat/VoiceWaveform.tsx
 * @module      AI Command Center / Chat
 * @purpose     Audio waveform visualization component for voice input using Web Audio API
 *
 * @ai_instructions
 *   - Waveform should only render when actively listening.
 *   - Must properly clean up audio resources to prevent memory leaks.
 *   - Canvas rendering should use requestAnimationFrame for smooth animation.
 *   - DO NOT modify audio context handling without updating voice input hooks.
 *
 * @exports     VoiceWaveform
 * @imports     react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';

// Type declaration for AudioContext support across browsers
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface VoiceWaveformProps {
  isListening: boolean;
  className?: string;
}

export function VoiceWaveform({ isListening, className }: VoiceWaveformProps) {
  // AI-NOTE: All refs must be properly cleaned up to prevent memory leaks
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // AI-WARN: Cleanup function must be called on unmount to release audio resources
  useEffect(() => {
    if (isListening) {
      startAudio();
    } else {
      stopAudio();
    }

    return () => stopAudio();
  }, [isListening]);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Use proper type guard for AudioContext with webkit fallback
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      draw();
    } catch (err) {
      console.error('Error accessing microphone for waveform:', err);
    }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Use primary color for the waveform
        ctx.fillStyle = `rgba(var(--primary), ${0.3 + (barHeight / canvas.height)})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    render();
  };

  if (!isListening) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={32} 
      className={className}
    />
  );
}
