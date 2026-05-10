import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 60 * 24, // 24 hours
		},
	},
});

// Create a persister that saves the cache to localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'HEALTH_TRACE_QUERY_CACHE',
});

// Wrap the client with persistence
persistQueryClient({
  queryClient: queryClientInstance,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});