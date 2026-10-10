/* 

Example notification 

{
    "notifiable": null,
    "modelInstance": 106,
    "notificationPayload": {
        "class": "TenantChannelMessageNotification",
        "title": "Tenant Channel",
        "message": "Tenant Message",
        "notificationPayload": {
            "user": null,
            "old": "CREATED",
            "new": "CREATED",
            "message": "comanda 106 Creada",
            "type": "tab.status",
            "marketplace": {
                "id": 3,
                "name": "Uber Portugal",
                "type": "marketplace",
                "brokerable_type": "Domain\\App\\Models\\Marketplace\\Marketplace",
                "system_marketplace": {
                    "id": 2,
                    "name": "Uber",
                    "class": "Domain\\App\\Services\\ECommerce\\Marketplaces\\Uber\\UberService",
                    "icon_url": "https://pw-api.ngrok.dev/storage/img/system_marketplaces/2/U1ZHD4BCjVWqVesiKsNdOUf9ZL2a5N7uVnr1b8AP.png",
                    "icon_path": "img/system_marketplaces/2/U1ZHD4BCjVWqVesiKsNdOUf9ZL2a5N7uVnr1b8AP.png"
                }
            }
        }
    },
    "model": "Domain\\App\\Models\\Tab\\Tab",
    "targetType": "role",
    "mailSubject": "Tenant Channel",
    "data": {
        "user": null,
        "old": "CREATED",
        "new": "CREATED",
        "message": "comanda 106 Creada",
        "type": "tab.status",
        "marketplace": {
            "id": 3,
            "name": "Uber Portugal",
            "type": "marketplace",
            "brokerable_type": "Domain\\App\\Models\\Marketplace\\Marketplace",
            "system_marketplace": {
                "id": 2,
                "name": "Uber",
                "class": "Domain\\App\\Services\\ECommerce\\Marketplaces\\Uber\\UberService",
                "icon_url": "https://pw-api.ngrok.dev/storage/img/system_marketplaces/2/U1ZHD4BCjVWqVesiKsNdOUf9ZL2a5N7uVnr1b8AP.png",
                "icon_path": "img/system_marketplaces/2/U1ZHD4BCjVWqVesiKsNdOUf9ZL2a5N7uVnr1b8AP.png"
            }
        }
    },
    "type": "message",
    "timestamp": "2025-05-25T00:03:30-04:00",
    "targetRoles": [
        "kitchen",
        "staff",
        "admin"
    ],
    "notify": "none"
}

*/

import { AuthPersistenceService } from 'dash-auth';

// Audio context for better browser compatibility
let audioContext: AudioContext | null = null;

// Default digital watch alarm configuration
const DEFAULTS = {
    ALARM_DURATION_SECONDS: 10,
    ALARM_FREQUENCY_HIGH: 4000,
    ALARM_FREQUENCY_LOW: 2500,
    BEEP_DURATION_MS: 100,
    BEEP_GAP_MS: 50,
    BEEP_PATTERN_GAP_MS: 300
};

interface AlarmSettings {
    alarm_duration_seconds?: number;
    alarm_frequency_high?: number;
    alarm_frequency_low?: number;
    beep_duration_ms?: number;
    beep_gap_ms?: number;
    beep_pattern_gap_ms?: number;
}

const initializeAudio = async (): Promise<boolean> => {
    try {
        // Initialize AudioContext if not already done
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume audio context if suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        return true;
    } catch (error) {
        console.error('Failed to initialize audio context:', error);
        return false;
    }
};

/**
 * Unlock AudioContext on first user interaction
 * required by modern browsers to allow autoplay
 */
export const unlockAudio = async (): Promise<void> => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        console.log('🔊 Audio Context unlocked/resumed:', audioContext.state);
    } catch (e) {
        console.error('🔊 Validate unlock:', e);
    }
};

/**
 * Play a single beep at specified frequency using oscillator (more reliable than buffer)
 */
const playOscillatorBeep = (frequency: number, durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
        if (!audioContext) {
            resolve();
            return;
        }

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'square'; // Square wave for that classic digital watch sound
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

            // Quick attack, sustain, quick release for sharp beep
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.005); // 5ms attack
            gainNode.gain.setValueAtTime(0.4, now + (durationMs / 1000) - 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + (durationMs / 1000)); // 10ms release

            oscillator.start(now);
            oscillator.stop(now + (durationMs / 1000));

            oscillator.onended = () => resolve();
        } catch (error) {
            console.error('Failed to play oscillator beep:', error);
            resolve();
        }
    });
};

/**
 * Play a digital watch alarm pattern: beep-beep-beep (pause) beep-beep-beep
 * Alternates between high and low frequencies
 */
const playAlarmPattern = async (useHighFreq: boolean, settings: AlarmSettings): Promise<void> => {
    const freq = useHighFreq 
        ? (settings.alarm_frequency_high ?? DEFAULTS.ALARM_FREQUENCY_HIGH) 
        : (settings.alarm_frequency_low ?? DEFAULTS.ALARM_FREQUENCY_LOW);
    
    const beepDuration = settings.beep_duration_ms ?? DEFAULTS.BEEP_DURATION_MS;
    const beepGap = settings.beep_gap_ms ?? DEFAULTS.BEEP_GAP_MS;

    // Play 3 quick beeps
    for (let i = 0; i < 3; i++) {
        await playOscillatorBeep(freq, beepDuration);
        if (i < 2) {
            await new Promise(r => setTimeout(r, beepGap));
        }
    }
};

/**
 * Play the full digital watch alarm sequence for specified duration
 * Returns a Promise that resolves when alarm completes
 */
export const playDigitalWatchAlarm = async (settings: AlarmSettings = {}): Promise<void> => {
    const durationSeconds = settings.alarm_duration_seconds ?? DEFAULTS.ALARM_DURATION_SECONDS;
    
    console.log(`🔔 Starting digital watch alarm for ${durationSeconds} seconds...`, settings);
    
    const initialized = await initializeAudio();
    if (!initialized) {
        console.error('Failed to initialize audio for alarm');
        return;
    }

    const startTime = Date.now();
    const endTime = startTime + (durationSeconds * 1000);
    let patternCount = 0;
    
    const patternGap = settings.beep_pattern_gap_ms ?? DEFAULTS.BEEP_PATTERN_GAP_MS;

    while (Date.now() < endTime) {
        // Alternate between high and low frequency patterns
        const useHighFreq = patternCount % 2 === 0;
        await playAlarmPattern(useHighFreq, settings);
        
        patternCount++;
        
        // Check if we still have time for another pattern
        if (Date.now() < endTime) {
            await new Promise(r => setTimeout(r, patternGap));
        }
    }

    console.log(`🔔 Digital watch alarm completed (${patternCount} patterns played)`);
};

/**
 * Legacy single beep for backwards compatibility
 */
const playNotificationSound = async (): Promise<void> => {
    await playOscillatorBeep(DEFAULTS.ALARM_FREQUENCY_HIGH, DEFAULTS.BEEP_DURATION_MS);
};

export const processCustomNotification = async (notification: any): Promise<{ alarmCompleted: boolean }> => {

    let marketplace = notification?.data?.marketplace?.system_marketplace?.name || "STORE" ;
    const isConfirmedStatus = notification?.data?.new === "CONFIRMED";
    let play = false;

    // Play alarm sound, if notification is assistance request or order is confirmed. 
    if (notification?.notificationPayload?.class === "MallStoreAssistanceNotification") {
        play = true;
    }

    // Play alarm for confirmed orders (non-Uber, non-self-service marketplaces)
    if (isConfirmedStatus) {
        play = true;
    }
    
    // Check for explicit alarm flag in data or payload
    // Backend sets alarm='true' for: Uber CREATED, Self-Service CREATED
    if (notification?.data?.alarm === "true" || notification?.data?.alarm === true || 
        notification?.notificationPayload?.alarm === "true" || notification?.notificationPayload?.alarm === true) {
        console.log("🚨 Alarm flag set by backend - playing alarm...");
        play = true;
    }

    if (play) {
      
        console.log("🚨 Playing digital watch alarm for new order...");
        
        // Retrieve settings from AuthPersistenceService
        let alarmSettings: AlarmSettings = {};
        try {
            const authData = AuthPersistenceService.getAuth();
            if (authData?.auth?.tenantSettings?.alarm_settings) {
                alarmSettings = authData.auth.tenantSettings.alarm_settings;
                console.log("Found tenant alarm settings:", alarmSettings);
            }
        } catch (err) {
            console.warn("Could not retrieve auth data for alarm settings, using defaults.", err);
        }

        // Play the digital watch alarm
        // This returns a Promise that resolves when alarm is complete
        await playDigitalWatchAlarm(alarmSettings);
        
        console.log("✅ Alarm sequence completed - TTS can now play");
      
        // Also show a browser notification if permissions allow
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Nueva Orden de ${marketplace}`, {
                body: notification?.data?.message || 'Nueva orden recibida',
                icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6a8.png', // Alarm icon emoji
                //tag: tag
            });
        }
        
        return { alarmCompleted: true };
    }
    
    return { alarmCompleted: false };
};

// Request notification permission on app load
export const requestNotificationPermission = async (): Promise<void> => {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
};
