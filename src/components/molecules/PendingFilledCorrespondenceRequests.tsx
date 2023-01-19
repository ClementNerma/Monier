import type { inferRouterOutputs } from '@trpc/server'
import { createResource, Show } from 'solid-js'
import { exportKey } from '../../common/crypto'
import {
	decryptTextAsymFromTRPC,
	decryptTextSymFromTRPC,
	encryptTextSymForTRPC,
	importKeyFromTRPC,
} from '../../common/crypto-trpc'
import { expectOk } from '../../common/utils'
import type { AppRouter } from '../../server'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'
import { ErrorMessage } from '../atom/ErrorMessage'

type EncryptedRequests = inferRouterOutputs<AppRouter>['correspondenceRequest']['individuals']['pendingFilledRequests']

export type PendingFilledCorrespondenceRequestsProps = {
	encryptedRequests: EncryptedRequests
}

export const PendingFilledCorrespondenceRequests = ({
	encryptedRequests,
}: PendingFilledCorrespondenceRequestsProps) => {
	type RequestEntry = {
		req: EncryptedRequests[number]
		displayName: string
		correspondenceKey: CryptoKey
	}

	const [requests, { refetch }] = createResource(() =>
		Promise.allSettled(
			encryptedRequests.map(async (req): Promise<RequestEntry> => {
				const masterKey = await expectMasterKey()

				const correspondenceInitPrivateKeyJWK = expectOk(
					await decryptTextSymFromTRPC(
						req.from.correspondenceInitPrivateKeyMK,
						req.from.correspondenceInitPrivateKeyMKIV,
						masterKey,
					),
				)

				const correspondenceInitPrivateKey = expectOk(
					await importKeyFromTRPC(correspondenceInitPrivateKeyJWK, 'asymPriv'),
				)

				const correspondenceKeyJWK = expectOk(
					await decryptTextAsymFromTRPC(req.correspondenceKeyCIPK, correspondenceInitPrivateKey),
				)

				const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym', true))

				const displayName = expectOk(
					await decryptTextSymFromTRPC(req.userDisplayNameCK, req.userDisplayNameCKIV, correspondenceKey),
				)

				return { displayName, req, correspondenceKey }
			}),
		),
	)

	async function answerRequest({ displayName, req, correspondenceKey }: RequestEntry) {
		const masterKey = await expectMasterKey()

		await trpc.correspondenceRequest.individuals.answerFilledRequest.mutate({
			correspondenceInitID: req.from.correspondenceInitID,
			correspondenceKeyMK: await encryptTextSymForTRPC(await exportKey(correspondenceKey), masterKey),
			userDisplayNameCK: await encryptTextSymForTRPC(displayName, masterKey),
		})

		alert('Success!')

		await refetch()
	}

	return (
		<table>
			<thead>
				<tr>
					<th>Nom</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<Show
					when={requests()}
					fallback={() => (
						<tr>
							<td colspan={2}>
								<em>Loading...</em>
							</td>
						</tr>
					)}
					keyed // TODO: Remove when type allows it
				>
					{(requests) =>
						requests.map((request) =>
							request.status === 'rejected' ? (
								<tr>
									<td colspan={2} style={{ 'text-align': 'center' }}>
										<ErrorMessage message={request.reason.message} inline />
									</td>
								</tr>
							) : (
								<tr>
									<td>{request.value.displayName}</td>
									<td>
										<button onClick={() => answerRequest(request.value)}>Confirm</button>
									</td>
								</tr>
							),
						)
					}
				</Show>
			</tbody>
		</table>
	)
}
