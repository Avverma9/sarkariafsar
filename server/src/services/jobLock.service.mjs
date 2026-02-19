import JobLock from "../models/jobLock.model.mjs";

export async function acquireJobLock({ key, owner, ttlMs = 30 * 60 * 1000 }) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + Math.max(1, Number(ttlMs)));

  let doc = null;
  try {
    doc = await JobLock.findOneAndUpdate(
      {
        key,
        $or: [{ lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }],
      },
      {
        $set: {
          owner: String(owner || ""),
          lockedUntil,
          lastRunAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    ).lean();
  } catch (err) {
    if (err?.code !== 11000) throw err;
  }

  const acquired = !!doc && String(doc.owner || "") === String(owner || "");
  return { acquired, lock: doc || null };
}

export async function renewJobLock({ key, owner, ttlMs = 30 * 60 * 1000 }) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + Math.max(1, Number(ttlMs)));

  const doc = await JobLock.findOneAndUpdate(
    { key, owner: String(owner || "") },
    { $set: { lockedUntil } },
    { returnDocument: "after" },
  ).lean();

  return { renewed: !!doc, lock: doc || null };
}

export async function releaseJobLock({ key, owner }) {
  await JobLock.updateOne(
    { key, owner: String(owner || "") },
    { $set: { lockedUntil: new Date(0) } },
  );
}

export async function forceReleaseJobLock({ key }) {
  await JobLock.updateOne(
    { key },
    {
      $set: {
        lockedUntil: new Date(0),
        owner: "",
      },
    },
  );
}
