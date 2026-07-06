import { getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { OrderPayload, SubmitResult } from "@/types/pizza";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb(): Firestore | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getFirestore(app);
}

/**
 * Pushes the order to the `orders` collection. When Firebase env vars are
 * absent (local dev / demo) it degrades gracefully: logs the payload and
 * reports success so the UX flow can be exercised end to end.
 */
export async function submitOrder(order: OrderPayload): Promise<SubmitResult> {
  const db = getDb();

  if (!db) {
    // eslint-disable-next-line no-console
    console.info(
      "[pizza] Firebase not configured — order payload:",
      JSON.stringify(order, null, 2)
    );
    return { ok: true, orderId: "local-demo" };
  }

  try {
    const ref = await addDoc(collection(db, "orders"), order);
    return { ok: true, orderId: ref.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown Firestore error",
    };
  }
}
