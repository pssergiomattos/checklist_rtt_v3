import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ServiceFormData, ServiceId } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
// CRITICAL: The app will break without specifying the databaseId if one is defined in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveInspectionReport(serviceId: ServiceId, formData: ServiceFormData) {
  const reportsRef = collection(db, 'inspections');
  const docRef = doc(reportsRef); // Auto-generate ID
  const path = `inspections/${docRef.id}`;

  const payload = {
    serviceId,
    tecnico: formData.tecnico,
    om: formData.om,
    identificacao: formData.identificacao,
    observacoes: formData.observacoes,
    status: formData.status,
    // Note: Photos might be too large for Firestore (1MB limit).
    // In a real app, photos should be uploaded to Firebase Storage and URLs saved here.
    // We will omit the photos from Firestore for now to prevent exceeding the 1MB limit.
    photosCount: Object.keys(formData.photos).length,
    createdAt: Date.now(),
    userId: auth.currentUser?.uid || 'anonymous',
  };

  try {
    await setDoc(docRef, payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Optional connection test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.error("Firestore connection error:", error);
    }
  }
}
