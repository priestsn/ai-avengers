import { useState, useRef, useEffect, useCallback } from "react";
import { Link, Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Mic, MicOff, Loader2, CheckCircle2,
  AlertCircle, Zap, Radio, PhoneOff, Volume2,
  Keyboard, Send, LayoutDashboard, BrainCircuit
} from "lucide-react";
import HaridAvatar3D from "@/components/HaridAvatar3D";
import { formatTime } from "@/lib/utils";
import { Button, Card } from "@/components/ui-elements";
import { useAuthToken } from "@/hooks/use-auth";
import { useGetMe } from "@workspace/api-client-react";
import { useI18n, getSpeechLang } from "@/i18n";
import { PatchNotesButton } from "@/components/PatchNotesModal";

type DeviceMode = "camera-mic" | "mic-only" | "keyboard-only";
type Phase = "VIDEO" | "RESULTS";

interface ConvMessage {
  role: "assistant" | "user";
  content: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

const TEST_POSITION = {
  title: "Aiutante Sviluppatore del Sito",
  description: "Supporto allo sviluppo e manutenzione della piattaforma AI Avengers",
  techStack: "React, TypeScript, Node.js, PostgreSQL, Vite",
};

const TEST_PRE_ANSWERS = {
  esperienza: "Sviluppatore della piattaforma AI Avengers",
  motivazione: "Test interno del sistema di colloqui AI",
  disponibilità: "Sì",
};

export default function TestHarid() {
  const { token } = useAuthToken();
  const { t, lang } = useI18n();
  const d = t.dashboard;

  const { data: user, isLoading: authLoading, isError: authError } = useGetMe({
    query: { enabled: !!token, retry: false },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [phase, setPhase] = useState<Phase>("VIDEO");
  const [deviceMode] = useState<DeviceMode>("camera-mic");
  const deviceModeRef = useRef<DeviceMode>("camera-mic");

  const [keyboardInput, setKeyboardInput] = useState("");
  const [keyboardSending, setKeyboardSending] = useState(false);

  const name = user?.name ?? "HR Tester";
  const email = user?.email ?? "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7 * 60);
  const timeLeftRef = useRef(7 * 60);
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);

  const [fillerWords, setFillerWords] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [userTurnCount, setUserTurnCount] = useState(0);
  const fillerRef = useRef(0);
  const wordRef = useRef(0);
  const turnRef = useRef(0);

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [haridStatus, setHaridStatus] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showAudioUnlock, setShowAudioUnlock] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const ttsCancelRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interviewDoneRef = useRef(false);
  const interviewActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const conversationRef = useRef<ConvMessage[]>([]);

  const startListeningRef = useRef<() => void>(() => {});
  const callHaridAPIRef = useRef<(history: ConvMessage[]) => Promise<void>>(async () => {});
  const finishInterviewRef = useRef<() => void>(() => {});

  interface VisualObs { score: number; issues: string[]; notes: string; timestamp: number; expressionScore?: number; gestureScore?: number; attireScore?: number; backgroundScore?: number; postureScore?: number; appearanceScore?: number; visualDescription?: string; }
  const visualObservationsRef = useRef<VisualObs[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenshotFramesRef = useRef<Array<{ imageBase64: string; timestamp: number; visualDescription?: string }>>([]);

  interface AudioObs { audioEnvironmentScore?: number; voiceToneScore?: number; multipleVoices?: boolean; multipleVoicesDetail?: string; audioTranscription?: string; audioNotes?: string; timestamp: number; }
  const audioObservationsRef = useRef<AudioObs[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestAudioSegmentRef = useRef<string | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const currentUtteranceWordCountRef = useRef(0);
  const [presentationScore, setPresentationScore] = useState<number | null>(null);
  const [presentationNotes, setPresentationNotes] = useState<string[]>([]);
  const [presentationSubScores, setPresentationSubScores] = useState<{ expression: number; gesture: number; attire: number; background: number; posture: number } | null>(null);

  const [scores, setScores] = useState({ total: 0, skills: 0, speech: 0, confidence: 0 });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    overallSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
    conversationSummary?: string;
  } | null>(null);

  const cleanTextForTTS = useCallback((text: string): string => {
    let clean = text;
    clean = clean.replace(/```[\s\S]*?```/g, "");
    clean = clean.replace(/\*\(([^)]*)\)\*/g, "");
    clean = clean.replace(/\(([^)]*(?:tono|pausa|sorriso|serio|allegro|professionale)[^)]*)\)/gi, "");
    clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
    clean = clean.replace(/\*([^*]+)\*/g, "$1");
    clean = clean.replace(/\*/g, "");
    clean = clean.replace(/__([^_]+)__/g, "$1");
    clean = clean.replace(/_([^_]+)_/g, "$1");
    clean = clean.replace(/`([^`]+)`/g, "$1");
    clean = clean.replace(/`/g, "");
    clean = clean.replace(/^#{1,6}\s+/gm, "");
    clean = clean.replace(/^-{3,}$/gm, "");
    clean = clean.replace(/^\s*[-*•]\s+/gm, "");
    clean = clean.replace(/^\s*\d+\.\s+/gm, "");
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    clean = clean.replace(/[[\]<>{}]/g, "");
    clean = clean.replace(/"/g, "");
    clean = clean.replace(/\//g, " ");
    clean = clean.replace(/\.{3,}/g, "...");
    clean = clean.replace(/\n{2,}/g, ". ");
    clean = clean.replace(/\n/g, " ");
    clean = clean.replace(/\s{2,}/g, " ");
    return clean.trim();
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) setSpeechSupported(false);
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (ttsCancelRef.current) { ttsCancelRef.current(); ttsCancelRef.current = null; }
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    if (currentBlobUrlRef.current) { URL.revokeObjectURL(currentBlobUrlRef.current); currentBlobUrlRef.current = null; }
  }, []);

  const interruptedByUserRef = useRef(false);

  const speakSentence = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      const clean = cleanTextForTTS(text);
      if (!clean) { resolve(); return; }

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setHaridStatus(t.apply.statusAiSpeaking);

      ttsCancelRef.current = () => resolve();

      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, lang }),
        });

        if (!res.ok) {
          ttsCancelRef.current = null;
          resolve();
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        currentBlobUrlRef.current = url;
        const audio = new Audio(url);
        currentAudioRef.current = audio;

        const cleanup = () => {
          URL.revokeObjectURL(url);
          if (currentBlobUrlRef.current === url) currentBlobUrlRef.current = null;
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
          ttsCancelRef.current = null;
        };

        audio.onended = () => { cleanup(); resolve(); };
        audio.onerror = () => { cleanup(); resolve(); };
        ttsCancelRef.current = () => { cleanup(); resolve(); };

        setShowAudioUnlock(false);
        try {
          await audio.play();
          if (deviceModeRef.current !== "keyboard-only" && !isMutedRef.current && !interviewDoneRef.current) {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognitionAPI) {
              const interruptRecognition = new SpeechRecognitionAPI();
              interruptRecognition.lang = getSpeechLang(lang);
              interruptRecognition.continuous = false;
              interruptRecognition.interimResults = true;
              interruptRecognition.onresult = (ev: SpeechRecognitionEvent) => {
                const lastResult = ev.results[ev.results.length - 1];
                const transcript = lastResult?.[0]?.transcript?.trim() ?? "";
                const confidence = lastResult?.[0]?.confidence ?? 0;
                if (transcript.length < 3 || confidence < 0.4) return;
                interruptedByUserRef.current = true;
                audio.pause();
                audio.currentTime = 0;
                cleanup();
                isSpeakingRef.current = false;
                setIsSpeaking(false);
                try { interruptRecognition.stop(); } catch { /* ignore */ }
                resolve();
              };
              interruptRecognition.onerror = () => {};
              interruptRecognition.onend = () => {};
              audio.addEventListener("ended", () => {
                try { interruptRecognition.stop(); } catch { /* ignore */ }
              }, { once: true });
              try { interruptRecognition.start(); } catch { /* ignore */ }
            }
          }
        } catch {
          if (isIOS) setShowAudioUnlock(true);
          cleanup();
          resolve();
        }
      } catch {
        ttsCancelRef.current = null;
        resolve();
      }
    });
  }, [cleanTextForTTS]);

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    stopCurrentAudio();
    interruptedByUserRef.current = false;

    const clean = cleanTextForTTS(text);
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];

    for (let si = 0; si < sentences.length; si++) {
      if (interviewDoneRef.current || interruptedByUserRef.current) break;
      await speakSentence(sentences[si].trim());
      if (interruptedByUserRef.current) break;
      if (si < sentences.length - 1 && !interviewDoneRef.current) {
        await new Promise(r => setTimeout(r, 120 + Math.random() * 200));
      }
    }

    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, [cleanTextForTTS, speakSentence, stopCurrentAudio]);

  const startListening = useCallback(() => {
    if (deviceModeRef.current === "keyboard-only") {
      setHaridStatus(t.apply.typeYourAnswer);
      return;
    }
    if (!speechSupported || isMutedRef.current || interviewDoneRef.current) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = getSpeechLang(lang);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    let finalTranscript = "";

    const pickBestAlternative = (result: SpeechRecognitionResult): string => {
      let best = result[0];
      for (let i = 1; i < result.length; i++) {
        if (result[i].confidence > best.confidence) best = result[i];
      }
      return best.transcript;
    };

    const cleanTranscriptForAI = (t: string): string =>
      t.replace(/[,;:\.!?]+$/, "").replace(/\s{2,}/g, " ").trim();

    recognition.onstart = () => {
      setIsListening(true);
      setLiveTranscript("");
      setHaridStatus(t.apply.statusListening);
      finalTranscript = "";
      currentUtteranceWordCountRef.current = 0;
    };

    let currentInterim = "";

    recognition.onresult = (event) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = pickBestAlternative(event.results[i]);
        if (event.results[i].isFinal) finalTranscript += t + " ";
        else currentInterim = t;
      }
      setLiveTranscript((finalTranscript + currentInterim).trim());
      const totalWords = (finalTranscript + currentInterim).trim().split(/\s+/).length;
      currentUtteranceWordCountRef.current = totalWords;
      let silenceTimeout: number;
      if (totalWords <= 3) {
        silenceTimeout = 5000;
      } else if (totalWords <= 10) {
        silenceTimeout = 4000;
      } else if (totalWords <= 25) {
        silenceTimeout = 3000;
      } else {
        silenceTimeout = 2200;
      }
      silenceTimerRef.current = setTimeout(() => recognition.stop(), silenceTimeout);
    };

    let micRetryCount = 0;
    const MAX_MIC_RETRIES = 3;

    recognition.onerror = (e) => {
      if (e.error === "no-speech") {
        recognition.stop();
      } else if (e.error === "not-allowed") {
        setIsListening(false);
        setHaridStatus(t.apply.statusMicNotAllowed);
      } else if (e.error === "audio-capture") {
        setIsListening(false);
        if (micRetryCount < MAX_MIC_RETRIES) {
          micRetryCount++;
          setHaridStatus(`${t.apply.statusAudioRetry} (${micRetryCount}/${MAX_MIC_RETRIES})...`);
          setTimeout(() => {
            try { recognition.start(); } catch { startListeningRef.current(); }
          }, 1000 * micRetryCount);
        } else {
          setHaridStatus(t.apply.statusMicUnavailable);
        }
      } else if (e.error === "network") {
        setIsListening(false);
        setHaridStatus(t.apply.statusNetworkRetry);
        setTimeout(() => {
          try { recognition.start(); } catch { startListeningRef.current(); }
        }, 2000);
      } else if (e.error !== "aborted") {
        setIsListening(false);
        setHaridStatus(t.apply.statusMicRetry);
        setTimeout(() => {
          try { recognition.start(); } catch { startListeningRef.current(); }
        }, 1500);
      }
    };

    recognition.onend = async () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      setLiveTranscript("");

      const wasMuteRequested = muteStopRequestedRef.current;
      if (wasMuteRequested) muteStopRequestedRef.current = false;
      const combined = wasMuteRequested
        ? (finalTranscript + " " + currentInterim).trim()
        : finalTranscript;
      const text = cleanTranscriptForAI(combined);

      micRetryCount = 0;

      if (text.length > 2 && !interviewDoneRef.current) {
        const fillerPattern = /\b(ehm|ah|beh|tipo|cioè|praticamente|diciamo|sai|vabbè|quindi|allora|dunque|insomma)\b/gi;
        const fillerMatches = text.match(fillerPattern)?.length ?? 0;
        fillerRef.current += fillerMatches;
        wordRef.current += text.split(/\s+/).length;
        turnRef.current += 1;
        setFillerWords(fillerRef.current);
        setWordCount(wordRef.current);
        setUserTurnCount(turnRef.current);

        const userMsg: ConvMessage = { role: "user", content: text };
        const updated = [...conversationRef.current, userMsg];
        conversationRef.current = updated;

        await callHaridAPIRef.current(updated);
      } else if (!interviewDoneRef.current && !isMutedRef.current) {
        setHaridStatus(t.apply.statusWaitingAnswer);
        setTimeout(() => startListeningRef.current(), 1000);
      }
    };

    try {
      recognition.start();
    } catch {
      setTimeout(() => startListeningRef.current(), 1500);
    }
  }, [speechSupported]);

  const callHaridAPI = useCallback(
    async (history: ConvMessage[]) => {
      if (interviewDoneRef.current) return;

      isThinkingRef.current = true;
      setIsThinking(true);
      setHaridStatus(t.apply.statusAiProcessing);

      let fullResponse = "";
      let sentenceBuffer = "";
      let startedSpeaking = false;

      const speakBufferedSentence = async (text: string) => {
        const cleaned = cleanTextForTTS(text);
        if (!cleaned || interviewDoneRef.current) return;
        if (!startedSpeaking) startedSpeaking = true;
        await speakSentence(cleaned);
      };

      try {
        const response = await fetch("/api/harid/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            positionTitle: TEST_POSITION.title,
            positionDescription: TEST_POSITION.description,
            techStack: TEST_POSITION.techStack,
            candidateName: name,
            candidatePreAnswers: TEST_PRE_ANSWERS,
            lang,
            turnCount: turnRef.current,
            timeLeft: timeLeftRef.current,
            ...(visualObservationsRef.current.length > 0 ? { visualObservations: visualObservationsRef.current } : {}),
            ...(audioObservationsRef.current.length > 0 ? { audioObservations: audioObservationsRef.current } : {}),
          }),
        });

        if (!response.ok) throw new Error("API error");
        isThinkingRef.current = false;
        setIsThinking(false);

        let shouldEndInterview = false;

        const processSSELines = async (lines: string[]) => {
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.endInterview) shouldEndInterview = true;
              if (data.content) {
                const cleaned = data.content.replace(/\[END_INTERVIEW\]/g, "");
                if (!cleaned) continue;
                fullResponse += cleaned;
                sentenceBuffer += cleaned;
                const sentenceEnd = sentenceBuffer.search(/[.!?]\s|[.!?]$/);
                if (sentenceEnd !== -1) {
                  const endPos = sentenceEnd + 1;
                  const sentence = sentenceBuffer.slice(0, endPos).trim();
                  sentenceBuffer = sentenceBuffer.slice(endPos);
                  if (sentence.length > 3) await speakBufferedSentence(sentence);
                }
              }
            } catch {}
          }
        };

        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        try { reader = response.body?.getReader() ?? undefined; } catch { reader = undefined; }

        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await processSSELines(decoder.decode(value, { stream: true }).split("\n"));
          }
        } else {
          const text = await response.text();
          await processSSELines(text.split("\n"));
        }

        if (sentenceBuffer.trim().length > 2) {
          await speakBufferedSentence(sentenceBuffer.trim());
        }

        isSpeakingRef.current = false;
        setIsSpeaking(false);

        if (fullResponse) {
          const assistantMsg: ConvMessage = { role: "assistant", content: fullResponse };
          conversationRef.current = [...history, assistantMsg];
        }

        if (shouldEndInterview && !interviewDoneRef.current) {
          setTimeout(() => finishInterviewRef.current(), 1500);
        } else if (!interviewDoneRef.current) {
          setHaridStatus(t.apply.statusWaitingAnswer);
          startListeningRef.current();
        }
      } catch {
        isThinkingRef.current = false;
        isSpeakingRef.current = false;
        setIsThinking(false);
        setIsSpeaking(false);
        setHaridStatus(t.apply.statusConnectionRetry);
        if (!interviewDoneRef.current) {
          setTimeout(() => startListeningRef.current(), 1500);
        }
      }
    },
    [name, cleanTextForTTS, speakSentence]
  );

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);
  useEffect(() => { callHaridAPIRef.current = callHaridAPI; }, [callHaridAPI]);

  const startAudioRecording = useCallback(() => {
    if (deviceModeRef.current === "keyboard-only") return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          const reader = new FileReader();
          reader.onloadend = () => { latestAudioSegmentRef.current = reader.result as string; };
          reader.readAsDataURL(blob);
        }
        if (!interviewDoneRef.current && mediaRecorderRef.current?.state !== "recording") {
          try {
            recorder.start();
            setTimeout(() => {
              if (recorder.state === "recording" && !interviewDoneRef.current) recorder.stop();
            }, 10000);
          } catch {}
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording" && !interviewDoneRef.current) recorder.stop();
      }, 10000);
    }).catch(() => {});
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const [interviewStarted, setInterviewStarted] = useState(false);

  const startInterview = useCallback(async () => {
    conversationRef.current = [];
    fillerRef.current = 0;
    wordRef.current = 0;
    turnRef.current = 0;
    audioObservationsRef.current = [];
    interviewActiveRef.current = true;
    setInterviewStarted(true);
    setShowAudioUnlock(false);
    setIsRecording(true);
    setHaridStatus(t.apply.statusConnecting);
    startAudioRecording();
    await callHaridAPI([]);
  }, [callHaridAPI, startAudioRecording]);

  const sendKeyboardMessage = useCallback(async (text: string) => {
    if (!text.trim() || interviewDoneRef.current) return;
    setKeyboardSending(true);
    setKeyboardInput("");

    wordRef.current += text.trim().split(/\s+/).length;
    turnRef.current += 1;
    setWordCount(wordRef.current);
    setUserTurnCount(turnRef.current);

    const userMsg: ConvMessage = { role: "user", content: text.trim() };
    const updated = [...conversationRef.current, userMsg];
    conversationRef.current = updated;

    await callHaridAPIRef.current(updated);
    setKeyboardSending(false);
  }, []);

  const performAudioUnlock = useCallback(() => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
    ctx.resume();
    setShowAudioUnlock(false);
  }, []);

  const muteStopRequestedRef = useRef(false);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      muteStopRequestedRef.current = true;
      recognitionRef.current?.stop();
      setHaridStatus(t.apply.statusMicMuted);
    } else {
      setHaridStatus(t.apply.statusMicUnmuted);
      if (!isSpeakingRef.current && !isThinkingRef.current && !interviewDoneRef.current) {
        setTimeout(() => startListeningRef.current(), 400);
      }
    }
  }, []);

  const finishInterview = useCallback(() => {
    if (interviewDoneRef.current) return;
    interviewDoneRef.current = true;
    interviewActiveRef.current = false;
    setInterviewStarted(false);

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    stopCurrentAudio();
    stopAudioRecording();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    isSpeakingRef.current = false;
    isThinkingRef.current = false;
    setIsRecording(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);

    const fw = fillerRef.current;
    const wc = wordRef.current;
    const conversation = conversationRef.current;

    const visObs = visualObservationsRef.current;
    let computedPresentationScore: number | null = null;
    let computedPresentationNotes: string[] = [];
    let computedSubScores: { expression: number; gesture: number; attire: number; background: number; posture: number } | null = null;
    if (visObs.length > 0) {
      const avgScore = Math.round(visObs.reduce((s, o) => s + o.score, 0) / visObs.length);
      computedPresentationScore = avgScore;
      computedPresentationNotes = visObs
        .flatMap((o) => o.issues)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 8);
      const avg = (key: keyof VisualObs) => {
        const vals = visObs.filter((o) => typeof o[key] === "number").map((o) => o[key] as number);
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : avgScore;
      };
      computedSubScores = {
        expression: avg("expressionScore"),
        gesture: avg("gestureScore"),
        attire: avg("attireScore"),
        background: avg("backgroundScore"),
        posture: avg("postureScore"),
      };
      setPresentationScore(avgScore);
      setPresentationNotes(computedPresentationNotes);
      setPresentationSubScores(computedSubScores);
    }

    setIsEvaluating(true);
    setPhase("RESULTS");

    void (async () => {
      try {
        const audioObs = audioObservationsRef.current;
        const evalRes = await fetch("/api/harid/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation,
            positionTitle: TEST_POSITION.title,
            positionDescription: TEST_POSITION.description,
            techStack: TEST_POSITION.techStack,
            candidateName: name,
            lang,
            ...(visObs.length > 0 ? { visualObservations: visObs } : {}),
            ...(audioObs.length > 0 ? { audioObservations: audioObs } : {}),
          }),
        });

        if (!evalRes.ok) throw new Error("Evaluate failed");
        const evaluation = await evalRes.json();

        const skillsScore = Math.min(100, Math.max(0, Math.round(evaluation.skillsScore ?? 0)));
        const speechScore = Math.min(100, Math.max(0, Math.round(evaluation.speechScore ?? 0)));
        const confidenceScore = Math.min(100, Math.max(0, Math.round(evaluation.confidenceScore ?? 0)));

        const rawTotal = computedPresentationScore !== null
          ? Math.round(skillsScore * 0.55 + speechScore * 0.22 + confidenceScore * 0.13 + computedPresentationScore * 0.10)
          : Math.round(skillsScore * 0.6 + speechScore * 0.25 + confidenceScore * 0.15);
        const totalScore = Math.min(100, rawTotal);

        setScores({ total: totalScore, skills: skillsScore, speech: speechScore, confidence: confidenceScore });
        setAiAnalysis({
          overallSummary: evaluation.overallSummary || evaluation.summary || "",
          strengths: evaluation.strengths || [],
          weaknesses: evaluation.weaknesses || [],
          recommendation: evaluation.recommendation || "",
          conversationSummary: evaluation.conversationSummary || "",
        });
      } catch {
        const minScore = turnRef.current >= 2 ? 25 : turnRef.current >= 1 ? 15 : 5;
        const skillsScore = Math.min(100, Math.max(minScore, Math.min(45, turnRef.current * 10)));
        const speechScore = Math.min(100, Math.max(minScore, Math.max(20, 60 - fw * 5)));
        const confidenceScore = Math.min(100, Math.max(minScore, 20 + wc * 0.03));
        const totalScore = Math.min(100, Math.round(skillsScore * 0.6 + speechScore * 0.25 + confidenceScore * 0.15));
        setScores({ total: totalScore, skills: skillsScore, speech: speechScore, confidence: confidenceScore });
      } finally {
        setIsEvaluating(false);
      }
    })();
  }, [name, stopCurrentAudio, stopAudioRecording]);

  useEffect(() => { finishInterviewRef.current = finishInterview; }, [finishInterview]);

  const captureAndAnalyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || interviewDoneRef.current) return;

    const canvas = document.createElement("canvas");
    const scale = 0.75;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 320;
    thumbCanvas.height = Math.round(320 * (video.videoHeight / video.videoWidth));
    const thumbCtx = thumbCanvas.getContext("2d");
    if (thumbCtx) {
      thumbCtx.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbBase64 = thumbCanvas.toDataURL("image/jpeg", 0.6);
      const currentFrames = screenshotFramesRef.current;
      if (currentFrames.length < 6) {
        currentFrames.push({ imageBase64: thumbBase64, timestamp: Date.now() });
      } else {
        const idx = Math.floor(Math.random() * (currentFrames.length - 1)) + 1;
        currentFrames[idx] = { imageBase64: thumbBase64, timestamp: Date.now() };
      }
    }

    try {
      const bodyPayload: Record<string, unknown> = { imageBase64, positionTitle: TEST_POSITION.title, positionDescription: TEST_POSITION.description };
      if (latestAudioSegmentRef.current) {
        bodyPayload.audioBase64 = latestAudioSegmentRef.current;
        latestAudioSegmentRef.current = null;
      }
      const res = await fetch("/api/harid/analyze-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      if (!res.ok) return;
      const obs = await res.json() as { score: number; issues: string[]; notes: string; expressionScore?: number; gestureScore?: number; attireScore?: number; backgroundScore?: number; postureScore?: number; appearanceScore?: number; visualDescription?: string; audioEnvironmentScore?: number; voiceToneScore?: number; multipleVoices?: boolean; multipleVoicesDetail?: string; audioTranscription?: string; audioNotes?: string };
      visualObservationsRef.current = [
        ...visualObservationsRef.current,
        { score: obs.score, issues: obs.issues, notes: obs.notes, timestamp: Date.now(), expressionScore: obs.expressionScore, gestureScore: obs.gestureScore, attireScore: obs.attireScore, backgroundScore: obs.backgroundScore, postureScore: obs.postureScore, appearanceScore: obs.appearanceScore, visualDescription: obs.visualDescription },
      ].slice(-12);
      if (obs.audioEnvironmentScore !== undefined || obs.voiceToneScore !== undefined) {
        audioObservationsRef.current = [
          ...audioObservationsRef.current,
          { audioEnvironmentScore: obs.audioEnvironmentScore, voiceToneScore: obs.voiceToneScore, multipleVoices: obs.multipleVoices, multipleVoicesDetail: obs.multipleVoicesDetail, audioTranscription: obs.audioTranscription, audioNotes: obs.audioNotes, timestamp: Date.now() },
        ].slice(-8);
      }
      const lastFrame = screenshotFramesRef.current[screenshotFramesRef.current.length - 1];
      if (lastFrame && obs.visualDescription) {
        lastFrame.visualDescription = obs.visualDescription;
      }
    } catch {}
  }, []);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async (retries = 3) => {
    setCameraError(null);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraReady(true);
        return;
      } catch (err: unknown) {
        const eName = err instanceof Error ? err.name : "";
        if (eName === "NotAllowedError") {
          setCameraError(t.apply.cameraAccessDenied);
          return;
        }
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        } else {
          setCameraError(t.apply.cameraAccessFailed);
        }
      }
    }
  };

  useEffect(() => {
    if (phase === "VIDEO") {
      if (deviceMode === "camera-mic") {
        startCamera();
      } else if (deviceMode === "mic-only") {
        (async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setCameraReady(true);
            setCameraError(null);
          } catch (err: unknown) {
            const errName = err instanceof Error ? err.name : "";
            if (errName === "NotAllowedError") {
              setCameraError(t.apply.micNotAuthorized);
            } else {
              setCameraError(t.apply.micAccessError);
            }
          }
        })();
      } else {
        setCameraReady(true);
      }
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopCurrentAudio();
      setCameraReady(false);
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopCurrentAudio();
    };
  }, [phase, deviceMode]);

  const timeoutClosingRef = useRef(false);
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 15 && !timeoutClosingRef.current && !interviewDoneRef.current) {
          timeoutClosingRef.current = true;
          (async () => {
            stopCurrentAudio();
            if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const closingMsg = t.apply.timeoutClosing;
            const closingConvMsg: ConvMessage = { role: "assistant", content: closingMsg };
            conversationRef.current = [...conversationRef.current, closingConvMsg];
            await speakText(closingMsg);
            if (!interviewDoneRef.current) finishInterview();
          })();
        }
        if (next <= 0 && !timeoutClosingRef.current) {
          if (!interviewDoneRef.current) finishInterview();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, finishInterview, stopCurrentAudio, speakText, lang]);

  useEffect(() => {
    if (phase !== "VIDEO" || !interviewStarted || deviceModeRef.current !== "camera-mic") {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      return;
    }
    const timeoutId = setTimeout(() => {
      if (interviewDoneRef.current) return;
      void captureAndAnalyzeFrame();
      frameIntervalRef.current = setInterval(() => {
        if (interviewDoneRef.current) {
          if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
          }
          return;
        }
        void captureAndAnalyzeFrame();
      }, 12000);
    }, 3000);
    return () => {
      clearTimeout(timeoutId);
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [phase, interviewStarted, captureAndAnalyzeFrame]);

  if (!token || authError) return <Redirect to="/" />;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-20 flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-display font-extrabold tracking-tight">
            AI <span className="text-primary">Avengers</span>
          </span>
        </Link>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="font-display font-bold text-sm text-purple-400">{d.testMode}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {phase === "VIDEO" && isRecording && (
            <>
              <div className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center text-sm font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-400 mr-2" /> REC
              </div>
              <div className="font-mono text-white text-lg font-bold">{formatTime(timeLeft)}</div>
            </>
          )}
          <PatchNotesButton />
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 z-10">
        <AnimatePresence mode="wait">

          {phase === "VIDEO" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
                style={{ height: "calc(100vh - 200px)", minHeight: "540px" }}
              >
                <div className="absolute inset-0 flex flex-col md:flex-row">
                  <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-[#1a1410]">
                    <HaridAvatar3D
                      speaking={isSpeaking}
                      thinking={isThinking}
                      listening={isListening}
                    />
                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-sm font-medium border border-white/10 flex items-center gap-2">
                        <span>Harid AI</span>
                        <span className="text-primary/70 text-xs">Recruiter</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none border-b md:border-b-0 md:border-r border-white/10" />
                  </div>

                  <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-black">
                    {deviceMode === "camera-mic" ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transition-transform duration-300"
                          style={{ transform: isCameraMirrored ? "scaleX(-1)" : "scaleX(1)" }}
                        />
                        {!cameraReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                            <Camera className="w-12 h-12 mb-3 text-white/30" />
                            {cameraError ? (
                              <>
                                <p className="text-red-400 text-sm text-center px-4 mb-3">{cameraError}</p>
                                <button
                                  onClick={() => startCamera()}
                                  className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
                                >
                                  {t.apply.retry}
                                </button>
                              </>
                            ) : (
                              <p className="text-white/50 text-sm">{t.apply.connectingCamera}</p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => setIsCameraMirrored((m) => !m)}
                          title={isCameraMirrored ? t.apply.mirrorOn : t.apply.mirrorOff}
                          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white/90 hover:bg-black/70 transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4">
                          {deviceMode === "mic-only" ? (
                            <Mic className="w-12 h-12 text-primary/60" />
                          ) : (
                            <Keyboard className="w-12 h-12 text-primary/60" />
                          )}
                        </div>
                        <p className="text-white/40 text-sm">
                          {deviceMode === "mic-only" ? t.apply.micOnlyMode : t.apply.keyboardMode}
                        </p>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 z-10">
                      <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-sm font-medium border border-white/10 flex items-center gap-2">
                        {name}
                        <span className="text-purple-400/70 text-xs">{d.testMode}</span>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>
                </div>

                <AnimatePresence>
                  {showAudioUnlock && (
                    <motion.div
                      key="audio-unlock"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="absolute inset-0 flex items-center justify-center z-40 pointer-events-auto"
                    >
                      <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-primary/30 p-6 flex flex-col items-center gap-4 max-w-xs mx-4 shadow-2xl">
                        <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <Volume2 className="w-7 h-7 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-semibold text-base mb-1">{t.apply.enableAudio}</p>
                          <p className="text-white/60 text-sm">{t.apply.enableAudioDesc}</p>
                        </div>
                        <button
                          onClick={performAudioUnlock}
                          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Volume2 className="w-4 h-4" /> {t.apply.tapToEnable}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isListening && liveTranscript && (
                    <motion.div
                      key="transcript"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-20 inset-x-0 flex justify-center px-8 z-20"
                    >
                      <div className="max-w-lg px-5 py-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-white/90 text-sm italic text-center">
                        "{liveTranscript}"
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {deviceMode === "keyboard-only" && isRecording && !isSpeaking && !isThinking && (
                  <div className="absolute bottom-16 inset-x-0 px-4 z-20">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void sendKeyboardMessage(keyboardInput);
                      }}
                      className="flex items-end gap-2 max-w-2xl mx-auto"
                    >
                      <div className="flex-1 relative">
                        <textarea
                          value={keyboardInput}
                          onChange={(e) => setKeyboardInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void sendKeyboardMessage(keyboardInput);
                            }
                          }}
                          placeholder={t.apply.typePlaceholder}
                          disabled={keyboardSending}
                          rows={2}
                          className="w-full px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!keyboardInput.trim() || keyboardSending}
                        className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
                      >
                        {keyboardSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </form>
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-t from-black/80 to-transparent">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border transition-all duration-300 ${
                      isSpeaking
                        ? "bg-primary/30 border-primary/40 text-white"
                        : isListening
                        ? "bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                        : isThinking
                        ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
                        : isMuted
                        ? "bg-red-500/20 border-red-500/30 text-red-300"
                        : "bg-white/10 border-white/10 text-white/70"
                    }`}
                  >
                    {isThinking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSpeaking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    {isListening && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    {isMuted && !isListening && !isSpeaking && !isThinking && <MicOff className="w-3.5 h-3.5" />}
                    {deviceMode === "keyboard-only" && !isThinking && !isSpeaking && <Keyboard className="w-3.5 h-3.5" />}
                    {deviceMode !== "keyboard-only" && !isThinking && !isSpeaking && !isListening && !isMuted && <div className="w-2 h-2 rounded-full bg-white/40" />}
                    <span>{haridStatus}</span>
                  </div>

                  {isRecording && (
                    <div className="flex items-center gap-3">
                      {deviceMode !== "keyboard-only" && (
                        <button
                          onClick={toggleMute}
                          title={isMuted ? t.apply.unmuteMic : t.apply.muteMic}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
                            isMuted
                              ? "bg-red-600/80 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                          }`}
                        >
                          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                      )}
                      <button
                        onClick={finishInterview}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm transition-colors shadow-lg"
                      >
                        <PhoneOff className="w-4 h-4" /> {t.apply.endCall}
                      </button>
                    </div>
                  )}
                </div>

                {!isRecording && cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 backdrop-blur-sm">
                    <div className="text-center max-w-sm px-6">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                        <img
                          src={`${import.meta.env.BASE_URL}harid-avatar.png`}
                          alt="Harid AI"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white mb-2">
                        {t.apply.haridReady}
                      </h2>
                      <p className="text-white/60 text-sm mb-2">
                        {deviceMode === "keyboard-only"
                          ? t.apply.haridReadyKeyboard
                          : t.apply.haridReadyVoice}
                      </p>
                      <div className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium mb-4 inline-flex items-center gap-1.5">
                        <BrainCircuit className="w-3 h-3" /> {d.testAiPosition}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 mb-6 flex items-start gap-2 text-left">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        <span>{t.apply.haridReadyTip}</span>
                      </div>
                      <Button
                        size="lg"
                        className="w-full text-base h-14 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                        onClick={startInterview}
                      >
                        <Radio className="w-5 h-5 mr-2" /> {t.apply.startInterviewBtn}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {phase === "RESULTS" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="max-w-2xl mx-auto p-10 border-white/10 text-center overflow-hidden">
                {isEvaluating ? (
                  <div className="py-12 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                        {t.apply.analyzing}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {t.apply.analyzingDesc}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium mb-6">
                      <BrainCircuit className="w-3 h-3" /> {d.testMode}
                    </div>

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                    </motion.div>

                    <h2 className="text-4xl font-display font-bold text-foreground mb-2">
                      {t.apply.interviewDone}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-3">
                      {userTurnCount}{" "}
                      {userTurnCount === 1 ? t.apply.turnSingular : t.apply.turnPlural}.
                    </p>
                    <p className="text-sm text-purple-400/80 mb-10">
                      {d.testAiDesc}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 mb-12">
                      <div className="relative w-44 h-44">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="7" className="text-white/5" />
                          <motion.circle
                            cx="50" cy="50" r="44" fill="none" stroke="currentColor"
                            strokeWidth="7" strokeDasharray="276"
                            initial={{ strokeDashoffset: 276 }}
                            animate={{ strokeDashoffset: 276 - (276 * scores.total) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            className={scores.total >= 80 ? "text-emerald-500" : scores.total >= 60 ? "text-yellow-500" : "text-red-500"}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-display font-bold">{scores.total}</span>
                          <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-5">
                        {[
                          { label: t.apply.skillsLabel, pct: presentationScore !== null ? 55 : 60, val: scores.skills, color: "bg-primary" },
                          { label: t.apply.communicationLabel, pct: presentationScore !== null ? 22 : 25, val: scores.speech, color: "bg-accent" },
                          { label: t.apply.motivationLabel, pct: presentationScore !== null ? 13 : 15, val: scores.confidence, color: "bg-purple-500" },
                          ...(presentationScore !== null
                            ? [{ label: t.apply.presentationLabel, pct: 10, val: presentationScore, color: "bg-emerald-500" }]
                            : []),
                        ].map(({ label, pct, val, color }, i) => (
                          <div key={label}>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                              <span>{label} ({pct}%)</span>
                              <span>{val}/100</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 1, delay: 0.8 + i * 0.2 }}
                                className={`h-full ${color} rounded-full`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {presentationScore !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 }}
                        className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground">{t.apply.presentationBehavior}</h3>
                            <p className="text-xs text-muted-foreground">{t.apply.presentationVisual}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            presentationScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                            presentationScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{presentationScore}/100</div>
                        </div>
                        {presentationSubScores && (
                          <div className="grid grid-cols-5 gap-2 mb-4">
                            {[
                              { label: t.apply.expressionLabel, val: presentationSubScores.expression },
                              { label: t.apply.gestureLabel, val: presentationSubScores.gesture },
                              { label: t.apply.attireLabel, val: presentationSubScores.attire },
                              { label: t.apply.backgroundLabel, val: presentationSubScores.background },
                              { label: t.apply.postureLabel, val: presentationSubScores.posture },
                            ].map(({ label, val }) => (
                              <div key={label} className="text-center p-2 rounded-lg bg-white/5">
                                <div className={`text-sm font-bold ${val >= 80 ? "text-emerald-400" : val >= 60 ? "text-yellow-400" : "text-red-400"}`}>{val}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {presentationNotes.length > 0 ? (
                          <ul className="space-y-1.5">
                            {presentationNotes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <AlertCircle className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> {t.apply.presentationOk}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {aiAnalysis && (aiAnalysis.overallSummary || (aiAnalysis.strengths && aiAnalysis.strengths.length > 0) || (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0) || aiAnalysis.recommendation) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-4"
                      >
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-purple-400" /> AI Analysis
                        </h3>

                        {aiAnalysis.overallSummary && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.overallSummary}</p>
                        )}

                        {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strengths</h4>
                            <ul className="space-y-1.5">
                              {aiAnalysis.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Areas for Improvement</h4>
                            <ul className="space-y-1.5">
                              {aiAnalysis.weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <AlertCircle className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.recommendation && (
                          <div className="pt-2 border-t border-white/5">
                            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Recommendation</h4>
                            <p className="text-sm text-muted-foreground">{aiAnalysis.recommendation}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-3xl font-mono text-white mb-1">{userTurnCount}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.apply.answersGiven}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-3xl font-mono text-white mb-1">{fillerWords}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.apply.fillerWordsLabel}</div>
                      </div>
                    </div>

                    <Link href="/dashboard">
                      <Button size="lg" variant="outline" className="w-full">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> {d.backToDashboard}
                      </Button>
                    </Link>
                  </>
                )}
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
