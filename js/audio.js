/*
 * AUDIO — two things, same as english-ldk:
 *
 *  1. speechSynthesis, so a 🔊 button can read the sum (or a story
 *     problem) aloud in the current language — long sentences are hard
 *     for a six-year-old to read on her own.
 *  2. tiny WebAudio blips for key taps and right/wrong/finished, no
 *     files, nothing to download or break offline.
 */

const AUDIO = (() => {

    /* ---------------- speech ---------------- */

    const speechSupported = 'speechSynthesis' in window;
    let unlocked = false;

    function voiceFor(lang){
        const voices = window.speechSynthesis.getVoices();
        const prefix = lang === 'en' ? 'en' : 'es';
        const preferred = lang === 'en' ? ['en-US', 'en-GB'] : ['es-UY', 'es-AR', 'es-419', 'es-MX', 'es-US', 'es-ES'];
        for(const code of preferred){
            const v = voices.find(v => v.lang === code || v.lang === code.replace('-', '_'));
            if(v) return v;
        }
        return voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix)) || null;
    }

    function speak(text, lang){
        if(!speechSupported || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'en' ? 'en-US' : 'es-419';
        utterance.rate = 0.9;
        const voice = voiceFor(lang);
        if(voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    }

    // iOS Safari only lets speech start from a real tap; call this from
    // the first tap anywhere so later reads work too
    function unlock(){
        if(unlocked) return;
        unlocked = true;
        if(speechSupported){
            const primer = new SpeechSynthesisUtterance('');
            primer.volume = 0;
            window.speechSynthesis.speak(primer);
        }
        const ac = context();
        if(ac && ac.state === 'suspended') ac.resume();
    }

    /* ---------------- WebAudio blips ---------------- */

    let ctx = null;
    let enabled = true;

    /* shared, so effects and the music bed never open two contexts */
    function context(){
        if(ctx) return ctx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if(!Ctor) return null;
        try{ ctx = new Ctor(); }catch(e){ ctx = null; }
        return ctx;
    }

    function tone(freq, start, duration, type, gain){
        const ac = context();
        if(!ac) return;
        const t0 = ac.currentTime + start;
        const osc = ac.createOscillator();
        const amp = ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        amp.gain.setValueAtTime(0.0001, t0);
        amp.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.015);
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(amp).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    function play(notes){
        if(!enabled) return;
        const ac = context();
        if(!ac) return;
        if(ac.state === 'suspended') ac.resume();
        notes.forEach(n => tone(n[0], n[1], n[2], n[3], n[4]));
    }

    return {
        speechSupported,
        speak,
        unlock,
        context,
        setEnabled(value){ enabled = !!value; },
        isEnabled(){ return enabled; },

        tap(){ play([[520, 0, 0.06, 'triangle', 0.04]]); },
        correct(){ play([[660, 0, 0.10, 'sine', 0.10], [880, 0.08, 0.14, 'sine', 0.09]]); },
        wrong(){ play([[300, 0, 0.12, 'sine', 0.06], [230, 0.09, 0.14, 'sine', 0.05]]); },
        complete(){
            play([
                [523, 0.00, 0.14, 'sine', 0.10],
                [659, 0.12, 0.14, 'sine', 0.10],
                [784, 0.24, 0.14, 'sine', 0.10],
                [1047, 0.36, 0.36, 'sine', 0.11],
            ]);
        },
    };
})();
