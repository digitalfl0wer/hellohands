export type RecognizedGesture = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export type GestureWorkerStatus = 'idle' | 'starting' | 'warming' | 'ready' | 'error';

export interface GestureWorkerConfig {
  fpsTarget: number;
  holdMs: number;
  releaseMs: number;
  refractoryMs: number;
  countdownMs: number;
  dropoutPolicy: 'latest' | 'drop_oldest';
}

export const DEFAULT_GESTURE_WORKER_CONFIG: GestureWorkerConfig = {
  fpsTarget: 24,
  holdMs: 900,
  releaseMs: 250,
  refractoryMs: 1000,
  countdownMs: 1200,
  dropoutPolicy: 'latest',
};

export type GestureWorkerInitMessage = {
  type: 'init';
  /**
   * Optional model/task asset reference that the worker should load.
   */
  modelAssetUrl?: string;
  warmupFrames?: number;
};

export type GestureWorkerConfigMessage = {
  type: 'config';
  config: Partial<GestureWorkerConfig>;
};

export type GestureWorkerFrameMessage = {
  type: 'frame';
  frame: ImageBitmap;
  frameId: number;
  sentAt: number;
};

export type GestureWorkerResetMessage = {
  type: 'reset';
  reason?: string;
};

export type GestureWorkerTerminateMessage = {
  type: 'terminate';
};

export type GestureWorkerCommand =
  | GestureWorkerInitMessage
  | GestureWorkerConfigMessage
  | GestureWorkerFrameMessage
  | GestureWorkerResetMessage
  | GestureWorkerTerminateMessage;

export type GestureWorkerCandidateEvent = {
  type: 'candidate';
  gesture: RecognizedGesture;
  score: number;
  frameId: number;
  ts: number;
};

export type GestureWorkerAcceptedEvent = {
  type: 'accepted';
  gesture: RecognizedGesture;
  score: number;
  holdMs: number;
  frameId: number;
  ts: number;
};

export type GestureWorkerLostEvent = {
  type: 'lost';
  frameId?: number;
  reason: 'timeout' | 'dropped' | 'low_score' | 'refractory';
  ts: number;
};

export type GestureWorkerCountdownEvent = {
  type: 'countdown_done';
  gesture?: RecognizedGesture;
  ts: number;
};

export type GestureWorkerStatusEvent = {
  type: 'status';
  status: GestureWorkerStatus;
  ts: number;
  details?: string;
};

export type GestureWorkerLogEvent = {
  type: 'log';
  level: 'info' | 'warn' | 'error';
  tag: string;
  message: string;
  ts: number;
};

export type GestureWorkerEvent =
  | GestureWorkerCandidateEvent
  | GestureWorkerAcceptedEvent
  | GestureWorkerLostEvent
  | GestureWorkerCountdownEvent
  | GestureWorkerStatusEvent
  | GestureWorkerLogEvent;
