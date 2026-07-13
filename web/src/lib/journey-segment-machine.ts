export type JourneyMachineStatus =
  | "idle"
  | "unlocking"
  | "buffering"
  | "playing"
  | "seeking"
  | "checkpoint_paused"
  | "suspended"
  | "fallback";

export type JourneyRequestSource = "intro" | "scroll" | "rail";

export type JourneySeekAttempt = "primary" | "exact" | null;

export type JourneyFallbackReason =
  | "metadata_timeout"
  | "play_rejected"
  | "waiting"
  | "stalled"
  | "system_paused"
  | "seek_exact_failed";

type JourneyResumeStatus = Exclude<
  JourneyMachineStatus,
  "suspended" | "fallback"
>;

type JourneyRequestScopedEventType =
  | "METADATA_TIMEOUT"
  | "PLAY_REJECTED"
  | "UNLOCK_CONFIRMED"
  | "WAITING"
  | "STALLED"
  | "SYSTEM_PAUSED"
  | "RETRY_SUCCEEDED"
  | "SEEK_PRIMARY_FAILED"
  | "SEEK_EXACT_FAILED";

type JourneyRequestScopedEvent = {
  [Type in JourneyRequestScopedEventType]: {
    type: Type;
    requestId: number;
  };
}[JourneyRequestScopedEventType];

export type JourneyMachineState = {
  status: JourneyMachineStatus;
  currentIndex: number;
  segmentTargetIndex: number | null;
  pendingTargetIndex: number | null;
  requestId: number;
  retryCount: number;
  motionEnabled: boolean;
  seekAttempt: JourneySeekAttempt;
  resumeStatus: JourneyResumeStatus | null;
  resumeTargetIndex: number | null;
  resumeSeekAttempt: JourneySeekAttempt;
  suspendReason: "motion" | "visibility" | null;
  fallbackReason: JourneyFallbackReason | null;
};

export type JourneyMachineEvent =
  | {
      type: "REQUEST";
      index: number;
      source: JourneyRequestSource;
    }
  | {
      type: "CHECKPOINT_REACHED";
      index: number;
      requestId: number;
    }
  | {
      type: "CHECKPOINT_FRAME_CONFIRMED";
      index: number;
      requestId: number;
    }
  | {
      type: "MOTION_CHANGED";
      enabled: boolean;
    }
  | JourneyRequestScopedEvent
  | {
      type: "VISIBILITY_HIDDEN" | "VISIBILITY_VISIBLE" | "PAGE_SHOWN";
    };

type CreateJourneyMachineOptions = {
  currentIndex?: number;
  motionEnabled?: boolean;
};

export function createJourneyMachineState({
  currentIndex = 0,
  motionEnabled = true,
}: CreateJourneyMachineOptions = {}): JourneyMachineState {
  return {
    status: motionEnabled ? "idle" : "suspended",
    currentIndex,
    segmentTargetIndex: null,
    pendingTargetIndex: null,
    requestId: 0,
    retryCount: 0,
    motionEnabled,
    seekAttempt: null,
    resumeStatus: null,
    resumeTargetIndex: null,
    resumeSeekAttempt: null,
    suspendReason: motionEnabled ? null : "motion",
    fallbackReason: null,
  };
}

function isStaleRequest(
  state: JourneyMachineState,
  event: { requestId: number },
) {
  return event.requestId !== state.requestId;
}

function startSeek(
  state: JourneyMachineState,
  index: number,
): JourneyMachineState {
  return {
    ...state,
    status: state.motionEnabled ? "seeking" : "suspended",
    segmentTargetIndex: index,
    pendingTargetIndex: null,
    requestId: state.requestId + 1,
    retryCount: 0,
    seekAttempt: "primary",
    resumeStatus: null,
    resumeTargetIndex: null,
    resumeSeekAttempt: null,
    suspendReason: state.motionEnabled ? null : "motion",
    fallbackReason: null,
  };
}

function enterFallback(
  state: JourneyMachineState,
  fallbackReason: JourneyFallbackReason,
): JourneyMachineState {
  return {
    ...state,
    status: "fallback",
    requestId: state.requestId + 1,
    seekAttempt: null,
    resumeStatus: null,
    resumeTargetIndex: null,
    resumeSeekAttempt: null,
    suspendReason: null,
    fallbackReason,
  };
}

function requestCheckpoint(
  state: JourneyMachineState,
  index: number,
  source: JourneyRequestSource,
): JourneyMachineState {
  if (!Number.isSafeInteger(index) || index < 0) {
    return state;
  }

  if (state.status === "fallback") {
    return {
      ...state,
      segmentTargetIndex: index,
      pendingTargetIndex: null,
      requestId: state.requestId + 1,
    };
  }

  if (source === "rail") {
    if (state.status === "suspended" && state.suspendReason === "visibility") {
      return {
        ...state,
        segmentTargetIndex: state.currentIndex,
        pendingTargetIndex: null,
        requestId: state.requestId + 1,
        retryCount: 0,
        seekAttempt: null,
        resumeStatus: "seeking",
        resumeTargetIndex: index,
        resumeSeekAttempt: "primary",
      };
    }

    return startSeek(state, index);
  }

  if (
    state.status === "unlocking" ||
    state.status === "buffering" ||
    (state.status === "suspended" && state.suspendReason === "visibility")
  ) {
    return {
      ...state,
      pendingTargetIndex: index,
    };
  }

  if (!state.motionEnabled) {
    return startSeek(state, index);
  }

  if (state.status === "seeking") {
    return startSeek(state, index);
  }

  if (
    source === "scroll" &&
    (state.status === "playing" || state.status === "checkpoint_paused")
  ) {
    return {
      ...state,
      pendingTargetIndex: index,
    };
  }

  if (index === state.currentIndex) {
    return state;
  }

  if (index < state.currentIndex) {
    return startSeek(state, index);
  }

  const segmentTargetIndex = state.currentIndex + 1;

  return {
    ...state,
    status: "playing",
    segmentTargetIndex,
    pendingTargetIndex:
      index > segmentTargetIndex ? index : null,
    requestId: state.requestId + 1,
    retryCount: 0,
    seekAttempt: null,
    resumeStatus: null,
    resumeTargetIndex: null,
    resumeSeekAttempt: null,
    suspendReason: null,
    fallbackReason: null,
  };
}

function confirmCheckpoint(
  state: JourneyMachineState,
  index: number,
): JourneyMachineState {
  if (index !== state.segmentTargetIndex) {
    return state;
  }

  if (state.status === "fallback") {
    return {
      ...state,
      currentIndex: index,
      segmentTargetIndex: null,
      pendingTargetIndex: null,
      requestId: state.requestId + 1,
    };
  }

  if (state.status === "suspended") {
    return {
      ...state,
      currentIndex: index,
      segmentTargetIndex: index,
      requestId: state.requestId + 1,
      retryCount: 0,
      seekAttempt: null,
      resumeStatus: null,
      resumeTargetIndex: null,
      resumeSeekAttempt: null,
      fallbackReason: null,
    };
  }

  if (state.status === "seeking" && state.resumeStatus !== null) {
    return {
      ...state,
      status: state.resumeStatus,
      currentIndex: index,
      segmentTargetIndex: state.resumeTargetIndex,
      requestId: state.requestId + 1,
      seekAttempt:
        state.resumeStatus === "seeking"
          ? state.resumeSeekAttempt ?? "primary"
          : null,
      resumeStatus: null,
      resumeTargetIndex: null,
      resumeSeekAttempt: null,
      suspendReason: null,
    };
  }

  if (state.status !== "checkpoint_paused" && state.status !== "seeking") {
    return state;
  }

  if (
    state.pendingTargetIndex !== null &&
    state.pendingTargetIndex > index
  ) {
    const segmentTargetIndex = index + 1;

    return {
      ...state,
      status: "playing",
      currentIndex: index,
      segmentTargetIndex,
      pendingTargetIndex:
        state.pendingTargetIndex > segmentTargetIndex
          ? state.pendingTargetIndex
          : null,
      requestId: state.requestId + 1,
      retryCount: 0,
      seekAttempt: null,
      resumeStatus: null,
      resumeTargetIndex: null,
      resumeSeekAttempt: null,
      suspendReason: null,
      fallbackReason: null,
    };
  }

  if (
    state.pendingTargetIndex !== null &&
    state.pendingTargetIndex < index
  ) {
    return startSeek(
      {
        ...state,
        currentIndex: index,
        pendingTargetIndex: null,
      },
      state.pendingTargetIndex,
    );
  }

  return {
    ...state,
    status: "idle",
    currentIndex: index,
    segmentTargetIndex: null,
    pendingTargetIndex: null,
    requestId: state.requestId + 1,
    retryCount: 0,
    seekAttempt: null,
    resumeStatus: null,
    resumeTargetIndex: null,
    resumeSeekAttempt: null,
    suspendReason: null,
    fallbackReason: null,
  };
}

function retryInterruptedOperation(
  state: JourneyMachineState,
  event: {
    type: "WAITING" | "STALLED" | "SYSTEM_PAUSED";
    requestId: number;
  },
): JourneyMachineState {
  if (isStaleRequest(state, event)) {
    return state;
  }

  const reason =
    event.type === "WAITING"
      ? "waiting"
      : event.type === "STALLED"
        ? "stalled"
        : "system_paused";

  if (state.retryCount >= 1) {
    return enterFallback(state, reason);
  }

  const resumeStatus =
    state.status === "buffering"
      ? state.resumeStatus
      : state.status === "playing" ||
          state.status === "seeking" ||
          state.status === "unlocking"
        ? state.status
        : null;

  if (resumeStatus === null) {
    return state;
  }

  return {
    ...state,
    status: "buffering",
    requestId: state.requestId + 1,
    retryCount: 1,
    resumeStatus,
    fallbackReason: null,
  };
}

function suspendForVisibility(
  state: JourneyMachineState,
): JourneyMachineState {
  if (
    state.status === "fallback" ||
    state.status === "suspended" ||
    state.suspendReason === "visibility" ||
    !state.motionEnabled
  ) {
    return state;
  }

  if (state.status === "seeking" && state.resumeStatus !== null) {
    return {
      ...state,
      status: "suspended",
      requestId: state.requestId + 1,
      suspendReason: "visibility",
    };
  }

  const resumeStatus =
    state.status === "buffering"
      ? state.resumeStatus
      : state.status;

  return {
    ...state,
    status: "suspended",
    requestId: state.requestId + 1,
    resumeStatus,
    resumeTargetIndex: state.segmentTargetIndex,
    resumeSeekAttempt: state.seekAttempt,
    suspendReason: "visibility",
  };
}

function resumeFromVisibility(
  state: JourneyMachineState,
): JourneyMachineState {
  if (
    state.status !== "suspended" ||
    state.suspendReason !== "visibility" ||
    !state.motionEnabled
  ) {
    return state;
  }

  return {
    ...state,
    status: "seeking",
    segmentTargetIndex: state.currentIndex,
    requestId: state.requestId + 1,
    seekAttempt: "primary",
    suspendReason: null,
  };
}

export function reduceJourneyMachine(
  state: JourneyMachineState,
  event: JourneyMachineEvent,
): JourneyMachineState {
  switch (event.type) {
    case "REQUEST":
      return requestCheckpoint(state, event.index, event.source);

    case "CHECKPOINT_REACHED":
      if (
        isStaleRequest(state, event) ||
        state.status !== "playing" ||
        event.index !== state.segmentTargetIndex
      ) {
        return state;
      }

      return {
        ...state,
        status: "checkpoint_paused",
      };

    case "CHECKPOINT_FRAME_CONFIRMED":
      if (isStaleRequest(state, event)) {
        return state;
      }
      return confirmCheckpoint(state, event.index);

    case "METADATA_TIMEOUT":
      if (isStaleRequest(state, event)) {
        return state;
      }
      return enterFallback(state, "metadata_timeout");

    case "PLAY_REJECTED":
      if (isStaleRequest(state, event)) {
        return state;
      }
      if (state.retryCount >= 1) {
        return enterFallback(state, "play_rejected");
      }
      if (state.status !== "playing") {
        return state;
      }
      return {
        ...state,
        status: "unlocking",
        requestId: state.requestId + 1,
        retryCount: 1,
        resumeStatus: "playing",
      };

    case "UNLOCK_CONFIRMED":
      if (
        isStaleRequest(state, event) ||
        state.status !== "unlocking"
      ) {
        return state;
      }
      return {
        ...state,
        status: state.resumeStatus ?? "playing",
        requestId: state.requestId + 1,
        resumeStatus: null,
        resumeTargetIndex: null,
        resumeSeekAttempt: null,
      };

    case "WAITING":
    case "STALLED":
    case "SYSTEM_PAUSED":
      return retryInterruptedOperation(state, event);

    case "RETRY_SUCCEEDED":
      if (
        isStaleRequest(state, event) ||
        state.status !== "buffering" ||
        state.resumeStatus === null
      ) {
        return state;
      }
      return {
        ...state,
        status: state.resumeStatus,
        requestId: state.requestId + 1,
        resumeStatus: null,
        resumeTargetIndex: null,
        resumeSeekAttempt: null,
      };

    case "SEEK_PRIMARY_FAILED":
      if (
        isStaleRequest(state, event) ||
        state.seekAttempt !== "primary" ||
        (state.status !== "seeking" && state.status !== "suspended")
      ) {
        return state;
      }
      return {
        ...state,
        requestId: state.requestId + 1,
        retryCount: 1,
        seekAttempt: "exact",
      };

    case "SEEK_EXACT_FAILED":
      if (
        isStaleRequest(state, event) ||
        state.seekAttempt !== "exact" ||
        (state.status !== "seeking" && state.status !== "suspended")
      ) {
        return state;
      }
      return enterFallback(state, "seek_exact_failed");

    case "VISIBILITY_HIDDEN":
      return suspendForVisibility(state);

    case "VISIBILITY_VISIBLE":
    case "PAGE_SHOWN":
      return resumeFromVisibility(state);

    case "MOTION_CHANGED": {
      if (event.enabled === state.motionEnabled) {
        return state;
      }

      if (state.status === "fallback") {
        return {
          ...state,
          requestId: state.requestId + 1,
          motionEnabled: event.enabled,
        };
      }

      if (event.enabled) {
        return {
          ...state,
          status: "idle",
          segmentTargetIndex: null,
          pendingTargetIndex: null,
          requestId: state.requestId + 1,
          retryCount: 0,
          motionEnabled: true,
          seekAttempt: null,
          resumeStatus: null,
          resumeTargetIndex: null,
          resumeSeekAttempt: null,
          suspendReason: null,
          fallbackReason: null,
        };
      }

      const reconciliationTarget =
        state.status === "seeking" && state.resumeStatus !== null
          ? state.resumeTargetIndex
          : null;
      const targetIndex =
        reconciliationTarget ??
        state.pendingTargetIndex ??
        state.segmentTargetIndex ??
        state.currentIndex;

      return {
        ...state,
        status: "suspended",
        segmentTargetIndex: targetIndex,
        pendingTargetIndex: null,
        requestId: state.requestId + 1,
        retryCount: 0,
        motionEnabled: false,
        seekAttempt: targetIndex === state.currentIndex ? null : "primary",
        resumeStatus: null,
        resumeTargetIndex: null,
        resumeSeekAttempt: null,
        suspendReason: "motion",
        fallbackReason: null,
      };
    }
  }
}
