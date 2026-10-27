// Runs off the UI thread. Copy microphone mono PCM in bounded chunks.
class MealRecorder extends AudioWorkletProcessor {
  constructor() {
    super(); this.samples = new Float32Array(4096); this.used = 0; this.stopped = false;
    this.port.onmessage = ({ data }) => { if (data === 'stop') { this.flush(); this.stopped = true; this.port.postMessage({ stopped: true }); } };
  }
  flush() { if (this.used) { const chunk = this.samples.slice(0, this.used); this.port.postMessage({ samples: chunk }, [chunk.buffer]); this.used = 0; } }
  process(inputs) {
    if (this.stopped) return false;
    const channels = inputs[0];
    if (!channels?.length) return true;
    for (let frame = 0; frame < channels[0].length; frame++) {
      let mono = 0; for (const channel of channels) mono += channel[frame] || 0;
      this.samples[this.used++] = mono / channels.length;
      if (this.used === this.samples.length) this.flush();
    }
    return true;
  }
}
registerProcessor('meal-recorder', MealRecorder);
