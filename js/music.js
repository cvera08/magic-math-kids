/* ============================================================
   Math LDK - background sound bed, the same one memory-ldk plays

   Not a melody. A melody is something the ear follows, and anything
   the ear follows competes with the game for attention - which is
   the opposite of what this app is for.

   What plays instead is the kind of thing people put on to study:
   a soft filtered noise bed, like distant rain, with very slow pad
   chords drifting over it. Nothing has a beat, nothing repeats on a
   period short enough to notice, and nothing ever arrives suddenly.
   ============================================================ */
const MUSIC = (function () {
  'use strict';

  /* Four warm voicings, each held for a long time and cross-faded.
     Low roots, wide spacing, no thirds fighting in the low register. */
  var CHORDS = [
    [130.81, 196.00, 329.63],   /* C3  G3  E4 */
    [110.00, 164.81, 261.63],   /* A2  E3  C4 */
    [87.31, 174.61, 261.63],    /* F2  F3  C4 */
    [98.00, 196.00, 293.66]     /* G2  G3  D4 */
  ];

  var CHORD_S = 11;        /* how long each chord is on stage */
  var ATTACK_S = 4.5;      /* nothing ever starts abruptly */
  var RELEASE_S = 6.5;     /* chords overlap, so there is no seam */
  var PAD_GAIN = 0.05;     /* per note - three notes stack to ~0.15 */
  var NOISE_GAIN = 0.035;
  var VOLUME = 0.55;       /* master, reached over a 3 second fade-in */

  var master = null;
  var noiseGain = null;
  var noiseSource = null;
  var breath = null;
  var timerId = null;
  var chordIndex = 0;
  var playing = false;

  /**
   * Brown noise: white noise integrated, which rolls off the harsh
   * high end and lands somewhere between rain and a ventilation hum.
   * Four seconds of it, looped - long enough that the loop is inaudible.
   */
  function brownNoise(ac) {
    var length = Math.floor(ac.sampleRate * 4);
    var buffer = ac.createBuffer(1, length, ac.sampleRate);
    var data = buffer.getChannelData(0);
    var last = 0;
    for (var i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  function build() {
    var ac = AUDIO.context();
    if (!ac) return null;
    if (master) return ac;

    var warmth = ac.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 1100;

    master = ac.createGain();
    master.gain.value = 0;
    master.connect(warmth).connect(ac.destination);

    /* Noise bed, heavily filtered so it sits under everything. */
    var muffle = ac.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 520;

    noiseGain = ac.createGain();
    noiseGain.gain.value = NOISE_GAIN;
    muffle.connect(noiseGain).connect(master);
    noiseGain._input = muffle;

    /* A very slow swell so the bed breathes instead of sitting flat. */
    breath = ac.createOscillator();
    var depth = ac.createGain();
    breath.frequency.value = 0.045;
    depth.gain.value = NOISE_GAIN * 0.45;
    breath.connect(depth).connect(noiseGain.gain);
    breath.start();

    return ac;
  }

  function startNoise(ac) {
    noiseSource = ac.createBufferSource();
    noiseSource.buffer = brownNoise(ac);
    noiseSource.loop = true;
    noiseSource.connect(noiseGain._input);
    noiseSource.start();
  }

  /** One pad note: two slightly detuned oscillators, long in and out. */
  function padNote(ac, freq, at) {
    var amp = ac.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(PAD_GAIN, at + ATTACK_S);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + ATTACK_S + RELEASE_S);
    amp.connect(master);

    [-3, 3].forEach(function (cents) {
      var osc = ac.createOscillator();
      var half = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      osc.detune.setValueAtTime(cents, at);
      half.gain.value = 0.5;
      osc.connect(half).connect(amp);
      osc.start(at);
      osc.stop(at + ATTACK_S + RELEASE_S + 0.2);
    });
  }

  function nextChord() {
    var ac = AUDIO.context();
    if (!ac || !playing) return;
    var at = ac.currentTime + 0.05;
    CHORDS[chordIndex % CHORDS.length].forEach(function (freq) {
      padNote(ac, freq, at);
    });
    chordIndex++;
  }

  return {
    isPlaying: function () { return playing; },

    start: function () {
      var ac = build();
      if (!ac || playing) return;
      if (ac.state === 'suspended') ac.resume();

      playing = true;
      if (!noiseSource) startNoise(ac);

      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(VOLUME, ac.currentTime + 3);

      nextChord();
      timerId = window.setInterval(nextChord, CHORD_S * 1000);
    },

    stop: function () {
      if (!playing) return;
      playing = false;
      window.clearInterval(timerId);
      timerId = null;

      var ac = AUDIO.context();
      if (!ac || !master) return;

      /* Fade out over two seconds, then let the noise loop go. */
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + 2);

      var source = noiseSource;
      noiseSource = null;
      window.setTimeout(function () {
        try { source.stop(); } catch (e) { /* already stopped */ }
      }, 2200);
    }
  };

})();
