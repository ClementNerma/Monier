export class Store<T> {
	private readonly listeners = new Map<Symbol, StoreListener<T>>()

	constructor(private value: T) {}

	get(): T {
		return this.value
	}

	set(newValue: T, afterUpdate?: () => void): void {
		this.value = newValue

		this.listeners.forEach((listener) => listener(newValue))

		afterUpdate?.()
	}

	listen(listener: StoreListener<T>): () => void {
		const sym = Symbol()
		this.listeners.set(sym, listener)

		return () => {
			this.listeners.delete(sym)
		}
	}

	subscribe(listener: StoreListener<T>): () => void {
		const unregister = this.listen(listener)

		listener(this.value)

		return unregister
	}
}

export type StoreListener<T> = (value: T) => void

export function createStore<T>(value: T): Store<T> {
	return new Store(value)
}
