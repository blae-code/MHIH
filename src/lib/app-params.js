const isNode = typeof window === 'undefined';
const env = /** @type {any} */ (import.meta).env || {};
const memoryStorage = (() => {
	const cache = new Map();
	return {
		getItem: (key) => (cache.has(key) ? cache.get(key) : null),
		setItem: (key, value) => cache.set(key, String(value)),
		removeItem: (key) => cache.delete(key),
	};
})();
const storage = isNode ? memoryStorage : window.localStorage;
const isProduction = !isNode && Boolean(env.PROD);
const allowUrlAccessToken = !isProduction || String(env.VITE_ALLOW_URL_ACCESS_TOKEN || "false") === "true";

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	const isAccessTokenParam = paramName === "access_token";
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam && isAccessTokenParam && !allowUrlAccessToken) {
		if (isProduction) {
			console.warn("URL access token was ignored in production mode.");
		}
		const storedBlocked = storage.getItem(storageKey);
		return storedBlocked || null;
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
