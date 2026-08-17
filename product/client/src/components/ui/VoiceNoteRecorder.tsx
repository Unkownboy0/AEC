import React, { useState } from 'react';
import { Mic, Square, Trash2, Play, Pause, AlertCircle, Check } from 'lucide-react';
import { AudioRecorderEngine } from '../../platform/audio-recorder';
import { HapticsService } from '../../platform/haptics';
import type { VoiceRecordingResult } from '../../platform/platform.types';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (result: VoiceRecordingResult) => void;
  onDiscard?: () => void;
  label?: string;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onRecordingComplete,
  onDiscard,
  label = 'Attach Voice Note',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [recordingResult, setRecordingResult] = useState<VoiceRecordingResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setErrorMessage(null);
    HapticsService.impact('medium');
    const started = await AudioRecorderEngine.startRecording(
      (ms) => setDurationMs(ms),
      (err) => {
        setErrorMessage(err);
        setIsRecording(false);
      }
    );
    if (started) {
      setIsRecording(true);
      setDurationMs(0);
      setRecordingResult(null);
    }
  };

  const handleStop = async () => {
    HapticsService.notification('success');
    setIsRecording(false);
    const result = await AudioRecorderEngine.stopRecording();
    if (result) {
      setRecordingResult(result);
      const audio = new Audio(result.url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
    }
  };

  const handleTogglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleDiscard = () => {
    HapticsService.impact('light');
    if (audioElement) {
      audioElement.pause();
    }
    AudioRecorderEngine.cancelRecording();
    setIsRecording(false);
    setRecordingResult(null);
    setAudioElement(null);
    setDurationMs(0);
    onDiscard?.();
  };

  const handleConfirm = () => {
    if (recordingResult) {
      HapticsService.notification('success');
      onRecordingComplete(recordingResult);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            {formatTime(durationMs)}
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {!isRecording && !recordingResult && (
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
          >
            <Mic className="h-4 w-4" />
            <span>Record Voice Note</span>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-500 animate-pulse"
          >
            <Square className="h-4 w-4" />
            <span>Stop & Save ({formatTime(durationMs)})</span>
          </button>
        )}

        {recordingResult && (
          <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-800 p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <span className="text-xs font-mono text-slate-300">
                Voice Note ({formatTime(recordingResult.durationMs)})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-rose-400"
                title="Discard"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Attach</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
