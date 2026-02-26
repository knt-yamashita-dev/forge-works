import workEndSoundData from "../../../../sounds/work-end.wav";
import breakEndSoundData from "../../../../sounds/break-end.wav";
import type { SoundType } from "../types/pomodoro";
import type { PomodoroSettings } from "../settings/settings";

export class SoundHelper {
	private settings: PomodoroSettings;
	private audioCache: Map<SoundType, HTMLAudioElement> = new Map();

	constructor(settings: PomodoroSettings) {
		this.settings = settings;
	}

	play(type: SoundType): void {
		let audio = this.audioCache.get(type);
		if (!audio) {
			const src = type === "work-end" ? workEndSoundData : breakEndSoundData;
			audio = new Audio(src);
			this.audioCache.set(type, audio);
		}
		audio.volume = this.settings.soundVolume;
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Silently fail if audio playback is blocked
		});
	}

	updateSettings(settings: PomodoroSettings): void {
		this.settings = settings;
	}
}
