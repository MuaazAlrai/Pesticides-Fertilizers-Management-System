import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAOS_ASDlyQffKJVsPrywRqeYqUgafgRcM',
  authDomain: 'pasticides-aap.firebaseapp.com',
  projectId: 'pasticides-aap',
  storageBucket: 'pasticides-aap.firebasestorage.app',
  messagingSenderId: '256717401673',
  appId: '1:256717401673:web:a0af1534be52304ae75998',
  measurementId: 'G-G8TS0HJDX4',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

void isSupported().then((supported) => {
  if (supported) getAnalytics(firebaseApp);
});
