class EventManager {
    private listeners: Map<string, Array<() => void>> = new Map();

    // Listener registrieren
    public subscribe(event: string, callback: () => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    // Event auslösen
    public emit(event: string): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            for (const listener of eventListeners) {
                listener(); // Rufe jede registrierte Callback-Funktion auf
            }
        }
    }
}

export default EventManager;