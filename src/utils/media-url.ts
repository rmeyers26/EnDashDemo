/**
 * Turn an EmDash `file` field value (e.g. a PDF or video) into a URL a browser can use.
 *
 * Why this helper exists: an `image` field can be rendered with the <Image> component,
 * but a `file` field is just a small object describing the upload. It has no ready-made URL.
 * EmDash gives us `getPublicMediaUrl()` (on `Astro.locals.emdash`) to build one from the
 * file's storage key, which also respects a public R2 domain if one is configured.
 *
 * Usage in a page:
 *   const url = getFileUrl(entry.data.video, Astro.locals.emdash?.getPublicMediaUrl);
 */

// The shape of a stored file value (only the parts we read).
interface StoredFile {
	provider?: string;
	url?: string;
	src?: string;
	meta?: { storageKey?: unknown } | null;
}

type PublicUrlBuilder = ((storageKey: string) => string) | undefined;

export function getFileUrl(
	file: unknown,
	getPublicMediaUrl: PublicUrlBuilder,
): string | undefined {
	// No file attached yet (e.g. the sample entries in the seed).
	if (!file || typeof file !== "object") return undefined;
	const value = file as StoredFile;

	// 1. Normal case: file uploaded through the Media Library -> build URL from storage key.
	const storageKey =
		typeof value.meta?.storageKey === "string" ? value.meta.storageKey : undefined;
	if (storageKey && getPublicMediaUrl) return getPublicMediaUrl(storageKey);

	// 2. A file added by external URL keeps that address in `src`.
	if (value.provider === "external") return value.src;

	// 3. Older values keep their address in `url`.
	return value.url;
}

/** Format an ISO date string / Date for display, e.g. "October 9, 2026". */
export function formatDate(value: Date | string | null | undefined): string | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
