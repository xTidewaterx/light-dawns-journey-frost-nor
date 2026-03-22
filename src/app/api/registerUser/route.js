import { NextResponse } from "next/server";
import admin from "firebase-admin";


import { v4 as uuidv4 } from "uuid";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://norland-a7730-default-rtdb.firebaseio.com",
  });
}

const db = admin.firestore();

export async function POST(req) {
  try {
    const { email, password, fullName, phone, photoURL } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create user with Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      photoURL: photoURL || null,
    });

    // Generate a unique user tag
    const userTag = `#${uuidv4().slice(0, 8)}`;

    const userData = {
      uid: userRecord.uid,
      email,
      fullName,
      displayName: fullName,
      phone: phone || null,
      photoURL: photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userTag,
    };


    const publicUserData = {
 
      fullName,

      fullName,
      displayName: fullName,
 
      photoURL: photoURL || null,
      uid: userRecord.uid
    
    
    }




    // Save in both collections
    await db.collection("users").doc(userRecord.uid).set(userData);
    await db.collection("publicUsers").doc(userRecord.uid).set(publicUserData);

    return NextResponse.json({ success: true, uid: userRecord.uid, userTag });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
