import type { inferRouterOutputs } from '@trpc/server'
import { createResource, Show } from 'solid-js'
import { decryptTextAsymFromTRPC, decryptTextSymFromTRPC, importKeyFromTRPC } from '../../common/crypto-trpc'
import { expectOk } from '../../common/utils'
import type { AppRouter } from '../../server'
import { expectMasterKey } from '../../state'
import { ErrorMessage } from '../atom/ErrorMessage'

export type PendingFilledCorrespondenceRequestsProps = {
	encryptedRequests: inferRouterOutputs<AppRouter>['correspondenceRequest']['individuals']['pendingFilledRequests']
}

export const PendingFilledCorrespondenceRequests = ({
	encryptedRequests,
}: PendingFilledCorrespondenceRequestsProps) => {
	const [requests] = createResource(() =>
		Promise.allSettled(
			encryptedRequests.map(async (req) => {
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

				const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym'))

				const displayName = expectOk(
					await decryptTextSymFromTRPC(req.userDisplayNameCK, req.userDisplayNameCKIV, correspondenceKey),
				)

				return { displayName }
			}),
		),
	)

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
									<td>Action buttons!</td>
								</tr>
							),
						)
					}
				</Show>
			</tbody>
		</table>
	)
}
