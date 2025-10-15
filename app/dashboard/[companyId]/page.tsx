import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import Link from "next/link";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The companyId is a path param
	const { companyId } = await params;

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

	const result = await whopSdk.access.checkIfUserHasAccessToCompany({
		userId,
		companyId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const company = await whopSdk.companies.getCompany({ companyId });

	// Either: 'admin' | 'no_access';
	// 'admin' means the user is an admin of the company, such as an owner or moderator
	// 'no_access' means the user is not an authorized member of the company
	const { accessLevel } = result;

	return (
		<div className="max-w-5xl mx-auto py-10 px-6 space-y-6">
			<div className="bg-white rounded-lg p-6 shadow">
				<h1 className="text-3xl font-semibold mb-2">{company.title}</h1>
				<p className="text-gray-600">
					Hi <strong>{user.name}</strong> (@{user.username}) — Access: {accessLevel}
				</p>
			</div>
			<div className="grid md:grid-cols-2 gap-6">
				<div className="bg-white rounded-lg p-6 shadow">
					<h2 className="text-xl font-semibold mb-4">Campaigns</h2>
					<div className="flex items-center justify-between mb-4">
						<Link
							className="text-blue-600 underline"
							href={`/experiences/${companyId}/campaigns/new`}
						>
							Create campaign
						</Link>
						<Link className="text-blue-600 underline" href={`/experiences/${companyId}/campaigns`}>
							View all
						</Link>
					</div>
					<p className="text-gray-500 text-sm">Manage newsletters and view performance.</p>
				</div>
				<div className="bg-white rounded-lg p-6 shadow">
					<h2 className="text-xl font-semibold mb-4">Members</h2>
					<form action={`/api/sync/members?companyId=${companyId}`} method="post">
						<button className="px-4 py-2 bg-black text-white rounded">Sync now</button>
					</form>
					<p className="text-gray-500 text-sm mt-2">Sync Whop members into Supabase.</p>
				</div>
			</div>
		</div>
	);
}
