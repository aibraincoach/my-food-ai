// 120s PCM16 mono16kHz is3.84MB, leaving multipart headroom below Vercel's4.5MB limit.
export const MAX_RECORDING_SECONDS=120;
export const MAX_WAV_BYTES=44+16000*2*MAX_RECORDING_SECONDS;
export const MAX_AUDIO_REQUEST_BYTES=4_000_000;
