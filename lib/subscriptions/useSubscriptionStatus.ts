"use client";

import { useCallback, useEffect, useState } from "react";

export type SubscriptionStatusResult = {
	tier: "free" | "pro" | "enterprise";
	canUseAI: boolean;
	canSend: boolean;
	isCompanyMember: boolean;
	authorizedUsersCount: number | null;
};

type State = {
	status: SubscriptionStatusResult;
	loading: boolean;
	error: string | null;
};

const INITIAL_STATE: State = {
	status: {
		tier: "free",
		canUseAI: false,
		canSend: false,
		isCompanyMember: false,
		authorizedUsersCount: null,
	},
	loading: true,
	error: null,
};

export function useSubscriptionStatus(companyId?: string | null) {
	const [state, setState] = useState<State>(INITIAL_STATE);

	const refresh = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
			const response = await fetch(`/api/subscription/status${query}`, { cache: "no-store" });
			const data = await response.json().catch(() => null);

			if (!response.ok || !data) {
				throw new Error(data?.error || "Unable to load subscription status");
			}

			setState({
				status: {
					tier: data.tier ?? "free",
					canUseAI: Boolean(data.canUseAI),
					canSend: Boolean(data.canSend),
					isCompanyMember: Boolean(data.isCompanyMember),
					authorizedUsersCount: typeof data.authorizedUsersCount === "number" ? data.authorizedUsersCount : null,
				},
				loading: false,
				error: null,
			});
		} catch (error) {
			console.error("[useSubscriptionStatus] Failed to fetch status", error);
			setState((prev) => ({ ...prev, loading: false, error: "Unable to fetch subscription status" }));
		}
	}, [companyId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return {
		status: state.status,
		loading: state.loading,
		error: state.error,
		refresh,
	};
}
