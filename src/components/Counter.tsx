import { createSignal } from 'solid-js'

export const Counter = () => {
	const [getCounter, setCounter] = createSignal(0)

	return (
		<div>
			<button onClick={() => setCounter(getCounter() - 1)}>-</button>
			<span>{getCounter()}</span>
			<button onClick={() => setCounter(getCounter() + 1)}>+</button>
		</div>
	)
}
