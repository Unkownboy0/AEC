import { deviceCapabilities } from './device-capabilities.manager';
import type { VoiceRecordingResult } from './platform.types';

export class AudioRecorderEngine {
  private static mediaRecorder: MediaRecorder | null = null;
  private static audioChunks: Blob[] = [];
  private static startTime = 0;
  private static timerInterval: any = null;

  /**
   * Starts recording audio contextually.
   */
  public static async startRecording(
    onTick?: (durationMs: number) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    const permission = await deviceCapabilities.requestMicrophonePermission();
    if (permission !== 'GRANTED') {
      if (permission === 'DISABLED_BY_SUPER_ADMIN') {
        onError?.('Voice notes are currently disabled by institutional policy.');
      } else if (permission === 'PERMANENTLY_DENIED') {
        deviceCapabilities.openAppSettingsGuide('Voice Notes', 'Microphone');
        onError?.('Microphone permission denied.');
      } else {
        onError?.('Microphone permission was not granted.');
      }
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4' }
        : undefined;

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start(200);

      if (onTick) {
        this.timerInterval = setInterval(() => {
          onTick(Date.now() - this.startTime);
        }, 100);
      }

      return true;
    } catch (err: any) {
      onError?.(err.message || 'Failed to access microphone');
      return false;
    }
  }

  /**
   * Stops recording and returns the compiled audio Blob and duration.
   */
  public static async stopRecording(): Promise<VoiceRecordingResult | null> {
    if (!this.mediaRecorder) return null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const durationMs = Date.now() - this.startTime;

    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(null);

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Stop all audio tracks
        this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
        this.mediaRecorder = null;
        this.audioChunks = [];

        resolve({
          blob,
          durationMs,
          url,
          mimeType,
        });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  /**
   * Cancels and discards active recording.
   */
  public static cancelRecording(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this.mediaRecorder = null;
    }
    this.audioChunks = [];
  }
}
