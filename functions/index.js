const functions = require("firebase-functions");
const admin = require("firebase-admin");
const csv = require("csvtojson");

admin.initializeApp();

exports.uploadCsv = functions.region('europe-west3').https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  let header;

  // Convert the CSV data to a JSON object
  let jsonData = await csv({
    output: "json",
    maxRowLength: 65535,
    flatKeys: true,
  }).on('header', (h) => {
    header = h;
  }).fromString(data);

  // Store the JSON object in the database
  let db = admin.firestore();
  let document = await db.collection("projects").add({
    header: header,
    data: jsonData,
    createdAt: new Date(),
    user: context.auth.uid,
    title: "Untitled Project"
  });

  // Return the ID of the created document
  return document.id;
});
