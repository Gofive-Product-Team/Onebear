let audioContext: AudioContext | null = null

export function playNotificationSound() {
	try {
		if (!audioContext) {
			audioContext = new AudioContext()
		}
		// Simple beep using Web Audio API (no external file needed)
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()
		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)
		oscillator.frequency.value = 800
		oscillator.type = 'sine'
		gainNode.gain.value = 0.3
		oscillator.start()
		gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
		oscillator.stop(audioContext.currentTime + 0.3)
	} catch {
		// Silently fail if audio not available
	}
}
