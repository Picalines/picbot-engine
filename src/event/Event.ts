export class Event<Args extends any[] = []> {
    private listeners: ((...args: Args) => void)[] = [];
    private onceListeners: ((...args: Args) => void)[] = [];

    on(listener: (...args: Args) => void) {
        this.listeners.push(listener);
    }

    once(listener: (...args: Args) => void) {
        this.onceListeners.push(listener);
    }

    off(listener: (...args: Args) => void) {
        const index = this.listeners.indexOf(listener);

        if (index < 0) {
            return false;
        }

        this.listeners.splice(index, 1);
        return true;
    }

    emit(...args: Args) {
        this.listeners.forEach(listener => listener(...args));

        const oncers = this.onceListeners;
        this.onceListeners = [];
        oncers.forEach(listener => listener(...args));
    }
}
