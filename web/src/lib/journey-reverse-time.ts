type ReverseTimelineOptions = {
  fps: number;
  frameCount: number;
};

function safeFrameCount(frameCount: number) {
  return Math.max(1, Math.floor(Number.isFinite(frameCount) ? frameCount : 1));
}

function safeFps(fps: number) {
  return Number.isFinite(fps) && fps > 0 ? fps : 25;
}

export function clampFrame(frame: number, frameCount: number) {
  const lastFrame = safeFrameCount(frameCount) - 1;
  const finiteFrame = Number.isFinite(frame) ? Math.round(frame) : 0;
  return Math.min(Math.max(finiteFrame, 0), lastFrame);
}

export function timeToFrame(time: number, options: ReverseTimelineOptions) {
  return clampFrame(time * safeFps(options.fps), options.frameCount);
}

export function frameToTime(frame: number, options: ReverseTimelineOptions) {
  return clampFrame(frame, options.frameCount) / safeFps(options.fps);
}

export function forwardFrameToReverseFrame(frame: number, frameCount: number) {
  const count = safeFrameCount(frameCount);
  return count - 1 - clampFrame(frame, count);
}

export function reverseFrameToForwardFrame(frame: number, frameCount: number) {
  return forwardFrameToReverseFrame(frame, frameCount);
}

export function forwardTimeToReverseTime(time: number, options: ReverseTimelineOptions) {
  const frame = timeToFrame(time, options);
  return frameToTime(forwardFrameToReverseFrame(frame, options.frameCount), options);
}

export function reverseTimeToForwardTime(time: number, options: ReverseTimelineOptions) {
  const frame = timeToFrame(time, options);
  return frameToTime(reverseFrameToForwardFrame(frame, options.frameCount), options);
}
