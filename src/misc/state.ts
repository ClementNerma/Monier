import { atom } from 'nanostores'

type State = {
	accessToken: string | null
}

export const state = atom<State>({
	accessToken: null,
})
