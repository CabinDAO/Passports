import { initializeApp } from "firebase/app";
import { getStorage, uploadBytes, ref } from "firebase/storage";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.FIREBASE_API_KEY) {
    throw new Error("Must set FIREBASE_API_KEY in `.env` file")
}

if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("Must set FIREBASE_API_KEY in `.env` file")
}

// Set the configuration for your app
// TODO: Replace with your app's config object
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_PROJECT_ID + ".firebaseapp.com",
  storageBucket: process.env.FIREBASE_PROJECT_ID + ".appspot.com",
  appId: process.env.FIREBASE_APP_ID,
};
const firebaseApp = initializeApp(firebaseConfig);

// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = getStorage(firebaseApp);
const file = fs.readFileSync("artifacts/contracts/Passport.sol/Passport.json");
const packageJsonVersion = JSON.parse(
  fs.readFileSync("package.json").toString()
).version;
const location = ref(storage, `abis/production/${packageJsonVersion}/stamp.json`);
uploadBytes(location, file)
  .then(() => console.log("successfully uploaded ABI!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
