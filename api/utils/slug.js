const DEFAULT_FALLBACK = 'item'

export const slugify = (value = '', fallback = DEFAULT_FALLBACK) => {
    const base = value
        ?.toString()
        ?.normalize('NFKD')
        ?.replace(/[\u0300-\u036f]/g, '')
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]+/g, '-')
        ?.replace(/^-+|-+$/g, '')

    return base || fallback
}

export const generateUniqueSlug = async (
    Model,
    baseSlug,
    excludeId = null,
    fallback = DEFAULT_FALLBACK
) => {
    let candidate = baseSlug || fallback
    let suffix = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const query = { slug: candidate }
        if (excludeId) {
            query._id = { $ne: excludeId }
        }

        const exists = await Model.exists(query)
        if (!exists) {
            return candidate
        }

        suffix += 1
        candidate = `${baseSlug || fallback}-${suffix}`
    }
}


