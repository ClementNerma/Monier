export type ErrorMessageProps = {
	message: string | null
	inline?: boolean
}

export const ErrorMessage = ({ message, inline }: ErrorMessageProps) => {
	return (
		<div style={inline ? { display: 'inline-block' } : {}}>
			<p style={{ color: 'red', border: '1px solid red', padding: '1rem', display: 'inline-block' }}>{message}</p>
		</div>
	)
}
