// src/app/api/syncPublicUsers/route.js
import { db, authAdmin } from "../../lib/firebaseAdmin";

export const runtime = "nodejs"; // ensures this runs server-side

async function verifyAdmin(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await authAdmin.verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req) {
  if (!await verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const usersSnapshot = await db.collection("users").get(); // db must not be undefined

    const promises = usersSnapshot.docs.map((userDoc) => {
      const userData = userDoc.data();
      const publicData = {
        username: userData.username || "",
        avatarUrl: userData.avatarUrl || "",
        bio: userData.bio || "",
        tag: userData.tag || "",
      };
      return db.collection("publicUsers").doc(userDoc.id).set(publicData, { merge: true });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ message: "All users synced!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error syncing users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
