const test = require('firebase-functions-test')({
	databaseURL: 'https://parandum-learning-dev.firebaseio.com',
	storageBucket: 'parandum-learning-dev.appspot.com',
	projectId: 'parandum-learning-dev',
}, '_private_stuff/parandum-learning-dev-private-key.json');

const admin = require("firebase-admin");
const cloudFunctions = require('../functions/index.js');
const firebase = require("@firebase/testing");

admin.initializeApp();
// const firestore = admin.firestore();
// LOCAL TESTING:
const firestore = firebase.initializeAdminApp({ projectId: "parandum-learning" }).firestore();

const userOne = "user_01";
const setOne = "set_01";
const vocabOne = "vocab_01";
const termOne = "term_01";
const definitionOne = "definition_01";
const soundOne = "sound_01";
const vocabTwo = "vocab_02";
const termTwo = "term_02";
const definitionTwo = "definition_02";
const soundTwo = "sound_02";

describe("Parandum Cloud Functions", () => {

	it("Can write & delete to/from online database", async () => {
		await firebase.assertSucceeds(
			firestore.collection("testCollection").doc("testDoc").set({
				"one": "1",
				"two": "2",
			})
		);
		await firebase.assertSucceeds(
			firestore.collection("testCollection").doc("testDoc").delete()
		);
	});

	it("Can create new progress file from existing set", async () => {
		const createProgress = test.wrap(cloudFunctions.createProgress);

		const setDataOne = {
			"owner": userOne,
			"public": false,
			"title": setOne,
		};
		const vocabDataOne = {
			"term": termOne,
			"definition": definitionOne,
			"sound": soundOne,
		};
		const vocabDataTwo = {
			"term": termTwo,
			"definition": definitionTwo,
			"sound": soundTwo,
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
				.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
				.collection("vocab").doc(vocabTwo).set(vocabDataTwo);

		const requestData = {
			switch_language: false,
			set_id: setOne,
		};

		return await firebase.assertSucceeds(createProgress(requestData));
	});
});