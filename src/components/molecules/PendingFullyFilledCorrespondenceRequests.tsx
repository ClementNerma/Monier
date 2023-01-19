import type { inferRouterOutputs } from '@trpc/server'
import { createResource, Show } from 'solid-js'
import { decryptTextSymFromTRPC, importKeyFromTRPC } from '../../common/crypto-trpc'
import { expectOk } from '../../common/utils'
import type { AppRouter } from '../../server'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'
import { ErrorMessage } from '../atom/ErrorMessage'

type EncryptedRequests =
	inferRouterOutputs<AppRouter>['correspondenceRequest']['individuals']['pendingFullyFilledRequests']

type EncryptedRequest = EncryptedRequests[number]

export type PendingFullyFilledCorrespondenceRequestsProps = {
	encryptedRequests: EncryptedRequests
}

export const PendingFullyFilledCorrespondenceRequests = ({
	encryptedRequests,
}: PendingFullyFilledCorrespondenceRequestsProps) => {
	const [requests, { refetch }] = createResource(() =>
		Promise.allSettled(
			encryptedRequests.map(async (req) => {
				const masterKey = await expectMasterKey()

				const correspondenceKeyJWK = expectOk(
					await decryptTextSymFromTRPC(req.from.correspondenceKeyMK, req.from.correspondenceKeyMKIV, masterKey),
				)

				const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym', true))

				const displayName = expectOk(
					await decryptTextSymFromTRPC(req.userDisplayNameCK, req.userDisplayNameCKIV, correspondenceKey),
				)

				return { displayName, req, correspondenceKey }
			}),
		),
	)

	async function answerRequest(req: EncryptedRequest) {
		await trpc.correspondenceRequest.individuals.markAcceptedRequest.mutate({
			correspondenceInitID: req.from.correspondenceInitID,
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
										<button onClick={() => answerRequest(request.value.req)}>Confirm</button>
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
