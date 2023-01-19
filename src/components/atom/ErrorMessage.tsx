export type ErrorMessageProps = {
	message: string | null
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
	return (
		<div>
			<p style={{ color: 'red', border: '1px solid red', padding: '1rem', display: 'inline-block' }}>{message}</p>
		</div>
	)
}
