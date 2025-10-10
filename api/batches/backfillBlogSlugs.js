import dotenv from 'dotenv'
import mongoose from 'mongoose'
import init from '../../config/mongo.js'
import Blogs from '../models/blogs.schema.js'

dotenv.config()

function slugify(title) {
  const base = (title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return base
}

async function ensureUniqueSlug(baseSlug) {
  let candidate = baseSlug
  let count = 0
  // Try incrementing suffix until we find a free slug
  // Note: Using a loop with exists() to avoid fetching whole docs
  // For small collections this is fine; adjust if needed for scale
  // Guard against empty base
  if (!candidate) candidate = 'blog'
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Blogs.exists({ slug: candidate })
    if (!exists) return candidate
    count += 1
    candidate = `${baseSlug}-${count}`
  }
}

async function main() {
  try {
    await init()
    const missing = await Blogs.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
      ],
    }).select('title slug').lean()

    if (!missing.length) {
      console.log('No blogs missing slug. Nothing to do.')
      await mongoose.connection.close()
      process.exit(0)
    }

    console.log(`Found ${missing.length} blogs without slug. Backfilling...`)

    let updated = 0
    for (const item of missing) {
      const base = slugify(item.title)
      const unique = await ensureUniqueSlug(base)
      await Blogs.updateOne({ _id: item._id }, { $set: { slug: unique } })
      updated += 1
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${missing.length}`)
      }
    }

    console.log(`Backfill complete. Updated ${updated} blogs.`)
    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error('Backfill failed:', err)
    try { await mongoose.connection.close() } catch {}
    process.exit(1)
  }
}

main()


