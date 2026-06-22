const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

let serviceAccount;

// ==========================
// RENDER PRODUCTION
// ==========================
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {

  serviceAccount = {
    type: "service_account",

    project_id:
      process.env.FIREBASE_PROJECT_ID,

    client_email:
      process.env.FIREBASE_CLIENT_EMAIL,

    private_key:
      process.env.FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      ),
  };

  console.log(
    "Using Firebase ENV credentials"
  );

}

// ==========================
// LOCAL DEVELOPMENT
// ==========================
else {

  serviceAccount =
    require("./firebase-key.json");

  console.log(
    "Using local firebase-key.json"
  );

}

const app = initializeApp({

  credential: cert(
    serviceAccount
  ),

});

const db = getFirestore(app);

module.exports = db;