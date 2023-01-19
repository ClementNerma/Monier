type Parser<T> = (value: string) => T | Error

function parseEnv<O extends object>(schema: { [Key in keyof O]: Parser<O[Key]> }): O {
	return Object.freeze(
		Object.fromEntries(
			Object.entries<Parser<unknown>>(schema).map(([varName, parser]) => {
				const data = process.env[varName]

				if (!Object.prototype.hasOwnProperty.call(process.env, varName) || data === undefined) {
					throw new Error(`Missing environment variable "${varName}"`)
				}

				const parsed = parser(data)

				if (parsed instanceof Error) {
					throw new Error(`Invalid data type for environment variable "${varName}", expected "${parser.name}"`)
				}

				return [varName, parsed]
			}),
		) as O,
	)
}

const string: Parser<string> = (value) => value
// const bool: Parser<boolean> = (value) => (value === 'true' ? true : value === 'false' ? false : new Error())
const int: Parser<number> = (value) => {
	const parsed = parseInt(value)
	return !Number.isNaN(parsed) && Number.isSafeInteger(parsed) ? parsed : new Error()
}

export const CONFIG = parseEnv({
	CURRENT_SERVER_URL: string,
	SESSION_EXPIRES_AFTER_HOURS: int,
})
