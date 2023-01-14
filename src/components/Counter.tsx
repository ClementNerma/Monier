import { createSignal, onMount } from 'solid-js'
import { client } from '../utils/trpc'

export const Counter = () => {
	const [getCounter, setCounter] = createSignal<number | null>(null)

	const fetchCounter = () => client.getCounter.query().then(setCounter)
	const incCounter = () => client.incCounter.mutate().then(() => fetchCounter())
	const decCounter = () => client.decCounter.mutate().then(() => fetchCounter())

	onMount(fetchCounter)

	return (
		<div>
			<button onClick={decCounter}>-</button>
			<span>{getCounter()}</span>
			<button onClick={incCounter}>+</button>
		</div>
	)
}
