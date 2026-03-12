import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 3,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			staleTime: 5 * 60 * 1000,   // 5 min — prevents redundant refetches on mount
			gcTime: 10 * 60 * 1000,     // 10 min — keep unused cache entries longer
		},
	},
});