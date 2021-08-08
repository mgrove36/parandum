const test = require('firebase-functions-test')({
	databaseURL: 'https://parandum-learning-dev.firebaseio.com',
	storageBucket: 'parandum-learning-dev.appspot.com',
	projectId: 'parandum-learning-dev',
}, '_private_stuff/parandum-learning-dev-private-key.json');

const admin = require("firebase-admin");
const cloudFunctions = require('../functions/index.js');
const firebase = require("@firebase/rules-unit-testing");
const hamjest = require("hamjest");
const assert = require("assert");

admin.initializeApp();
const firestore = admin.firestore();
// LOCAL TESTING:
const firestoreEmulator = firebase.initializeAdminApp({ projectId: "parandum-learning" }).firestore();

const userOne = "user_01";
const userTwo = "user_02";
const setOne = "set_01";
const setTwo = "set_02";
const vocabOne = "vocab_01";
const termOne = "term_01";
const definitionOne = "definition_01";
const soundOne = "sound_01";
const vocabTwo = "vocab_02";
const termTwo = "term_02";
const definitionTwo = "definition_02";
const soundTwo = "sound_02";
const groupOne = "group_01";
const doubleDefinitionOne = "definition/01";
const doubleDefinitionTwo = "definition/02";
const punctuationDefinitionOne = "definition .,()-_'\"01";

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

	it("createProgress can create new questions mode progress file from existing set", async () => {
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
			mode: "questions",
			limit: 2,
		};

		const progressId = await createProgress(requestData);
		const progressDocId = firestore.collection("progress").doc(progressId);

		const snapAfter = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfter.questions, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_02"]),
			hamjest.is(["vocab_02", "vocab_01"])
		));
		assert.deepStrictEqual(snapAfter.correct, []);
		assert.deepStrictEqual(snapAfter.incorrect, []);
		assert.deepStrictEqual(snapAfter.current_correct, []);
		assert.strictEqual(snapAfter.duration, null);
		assert.strictEqual(snapAfter.progress, 0);
		assert.strictEqual(snapAfter.set_title, setOne);
		assert.notStrictEqual(snapAfter.start_time, null);
		assert.strictEqual(snapAfter.switch_language, false);
		assert.strictEqual(snapAfter.uid, userOne);
		assert.strictEqual(snapAfter.set_owner, userOne);
		assert.strictEqual(snapAfter.mode, "questions");
	});

	it("createProgress can create new lives mode progress file from existing set", async () => {
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
			mode: "lives",
			limit: 2,
		};

		const progressId = await createProgress(requestData);
		const progressDocId = firestore.collection("progress").doc(progressId);

		const snapAfter = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfter.questions, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_02"]),
			hamjest.is(["vocab_02", "vocab_01"])
		));
		assert.deepStrictEqual(snapAfter.correct, []);
		assert.deepStrictEqual(snapAfter.incorrect, []);
		assert.deepStrictEqual(snapAfter.current_correct, []);
		assert.strictEqual(snapAfter.duration, null);
		assert.strictEqual(snapAfter.progress, 0);
		assert.strictEqual(snapAfter.set_title, setOne);
		assert.notStrictEqual(snapAfter.start_time, null);
		assert.strictEqual(snapAfter.switch_language, false);
		assert.strictEqual(snapAfter.uid, userOne);
		assert.strictEqual(snapAfter.set_owner, userOne);
		assert.strictEqual(snapAfter.mode, "lives");
		assert.strictEqual(snapAfter.lives, 2);
	});

	it("createProgress can create new progress file from public set they aren't the owner of", async () => {
		const createProgress = test.wrap(cloudFunctions.createProgress);

		const setDataTwo = {
			"owner": userTwo,
			"public": true,
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

		await firestore.collection("sets").doc(setTwo).set(setDataTwo);
		await firestore.collection("sets").doc(setTwo)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setTwo)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);

		const requestData = {
			switch_language: false,
			set_id: setOne,
			mode: "questions",
			limit: 2,
		};

		return await firebase.assertSucceeds(createProgress(requestData));
	});

	it("createProgress can't create new progress file from non-public set they aren't the owner of", async () => {
		const createProgress = test.wrap(cloudFunctions.createProgress);

		const setDataTwo = {
			"owner": userTwo,
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

		await firestore.collection("sets").doc(setTwo).set(setDataTwo);
		await firestore.collection("sets").doc(setTwo)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setTwo)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);

		const requestData = {
			switch_language: false,
			set_id: setTwo,
			mode: "questions",
			limit: 2,
		};
		
		return await firebase.assertFails(createProgress(requestData));
	});

	it("processAnswer updates progress documents appropriately when correct and incorrect answers provided", async () => {
		const processAnswer = test.wrap(cloudFunctions.processAnswer);

		const progressData = {
			correct: [],
			current_correct: [],
			duration: null,
			incorrect: [],
			progress: 0,
			questions: [
				vocabOne,
				vocabTwo
			],
			set_title: setOne,
			start_time: 1627308670962,
			switch_language: false,
			uid: userOne,
			set_owner: userOne,
			mode: "questions",
		};
		const termDataOne = {
			"item": termOne,
			"sound": soundOne,
		};
		const termDataTwo = {
			"item": termTwo,
			"sound": soundTwo,
		};
		const definitionDataOne = {
			"item": definitionOne,
		};
		const definitionDataTwo = {
			"item": definitionTwo,
		};

		const progressId = "progress_01";
		const progressDocId = firestore.collection("progress").doc(progressId);

		await progressDocId.set(progressData);
		await progressDocId.collection("terms").doc(vocabOne)
			.set(termDataOne);
		await progressDocId.collection("terms").doc(vocabTwo)
			.set(termDataTwo);
		await progressDocId.collection("definitions").doc(vocabOne)
			.set(definitionDataOne);
		await progressDocId.collection("definitions").doc(vocabTwo)
			.set(definitionDataTwo);

		const firstTermAnswerRequestData = {
			progressId: progressId,
			answer: "definition_01",
		};
		const secondTermAnswerRequestData = {
			progressId: progressId,
			answer: "definition_02",
		};

		const firstReturn = await processAnswer(secondTermAnswerRequestData);

		hamjest.assertThat(firstReturn, hamjest.anyOf(
			hamjest.is({
				mode: "questions",
				correct: false,
				correctAnswers: [definitionOne],
				moreAnswers: false,
				nextPrompt: {
					item: termOne,
					sound: soundOne,
				},
				progress: 1,
				totalQuestions: 3,
				totalCorrect: 0,
				totalIncorrect: 1,
			}),
			hamjest.is({
				mode: "questions",
				correct: false,
				correctAnswers: [definitionOne],
				moreAnswers: false,
				nextPrompt: {
					item: termTwo,
					sound: soundTwo,
				},
				progress: 1,
				totalQuestions: 3,
				totalCorrect: 0,
				totalIncorrect: 1,
			})
		));

		const snapAfterIncorrectData = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfterIncorrectData, hamjest.anyOf(
			hamjest.is({
				correct: [],
				current_correct: [],
				duration: null,
				incorrect: [vocabOne],
				progress: 1,
				questions: [
					vocabOne,
					vocabOne,
					vocabTwo
				],
				set_title: setOne,
				start_time: 1627308670962,
				switch_language: false,
				uid: userOne,
				set_owner: userOne,
				mode: "questions",
			}),
			hamjest.is({
				correct: [],
				current_correct: [],
				duration: null,
				incorrect: [vocabOne],
				progress: 1,
				questions: [
					vocabOne,
					vocabTwo,
					vocabOne
				],
				set_title: setOne,
				start_time: 1627308670962,
				switch_language: false,
				uid: userOne,
				set_owner: userOne,
				mode: "questions",
			})
		));

		if (firstReturn.nextPrompt.item === "term_01") {
			await processAnswer(firstTermAnswerRequestData);
			await processAnswer(secondTermAnswerRequestData);
		} else {
			await processAnswer(secondTermAnswerRequestData);
			await processAnswer(firstTermAnswerRequestData);
		}

		const snapAfterCorrectData = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfterCorrectData.correct, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_02"]),
			hamjest.is(["vocab_02", "vocab_01"])
		));
		hamjest.assertThat(snapAfterCorrectData.questions, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_01", "vocab_02"]),
			hamjest.is(["vocab_01", "vocab_02", "vocab_01"])
		));
		assert.deepStrictEqual(snapAfterCorrectData.incorrect, [vocabOne]);
		assert.deepStrictEqual(snapAfterCorrectData.current_correct, []);
		assert.notStrictEqual(snapAfterCorrectData.duration, null);
		assert.strictEqual(snapAfterCorrectData.progress, 3);
		assert.strictEqual(snapAfterCorrectData.set_title, setOne);
		assert.strictEqual(snapAfterCorrectData.start_time, 1627308670962);
		assert.strictEqual(snapAfterCorrectData.switch_language, false);
		assert.strictEqual(snapAfterCorrectData.uid, userOne);
		assert.strictEqual(snapAfterCorrectData.set_owner, userOne);
		assert.strictEqual(snapAfterCorrectData.mode, "questions");
	});

	it("processAnswer correctly handles correct and incorrect inputted answers when a vocab term has multiple required answers", async () => {
		const processAnswer = test.wrap(cloudFunctions.processAnswer);

		const progressData = {
			correct: [],
			duration: null,
			incorrect: [],
			current_correct: [],
			progress: 0,
			questions: [
				vocabOne,
				vocabTwo
			],
			set_title: setOne,
			start_time: 1627308670962,
			switch_language: false,
			uid: userOne,
			set_owner: userOne,
			mode: "questions",
		};
		const termDataOne = {
			"item": termOne,
			"sound": soundOne,
		};
		const termDataTwo = {
			"item": termTwo,
			"sound": soundTwo,
		};
		const definitionDataOne = {
			"item": doubleDefinitionOne,
		};
		const definitionDataTwo = {
			"item": doubleDefinitionTwo,
		};

		const progressId = "progress_01";
		const progressDocId = firestore.collection("progress").doc(progressId);

		await progressDocId.set(progressData);
		await progressDocId.collection("terms").doc(vocabOne)
			.set(termDataOne);
		await progressDocId.collection("terms").doc(vocabTwo)
			.set(termDataTwo);
		await progressDocId.collection("definitions").doc(vocabOne)
			.set(definitionDataOne);
		await progressDocId.collection("definitions").doc(vocabTwo)
			.set(definitionDataTwo);

		const firstTermAnswerOneRequestData = {
			progressId: progressId,
			answer: "definition",
		};
		const firstTermAnswerTwoRequestData = {
			progressId: progressId,
			answer: "01",
		};
		const secondTermAnswerOneRequestData = {
			progressId: progressId,
			answer: "definition",
		};
		const secondTermAnswerTwoRequestData = {
			progressId: progressId,
			answer: "02",
		};

		const returnAfterCorrect = await processAnswer(firstTermAnswerOneRequestData);
		 
		assert.deepStrictEqual(returnAfterCorrect, {
			mode: "questions",
			correct: true,
			correctAnswers: ["definition"],
			moreAnswers: true,
			nextPrompt: null,
			progress: 0,
			totalQuestions: 2,
			totalCorrect: 0,
			totalIncorrect: 0,
		});

		const snapAfterTermOneAnswerOneData = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		assert.deepStrictEqual(snapAfterTermOneAnswerOneData, {
			correct: [],
			current_correct: ["definition"],
			duration: null,
			incorrect: [],
			progress: 0,
			questions: [
				vocabOne,
				vocabTwo
			],
			set_title: setOne,
			start_time: 1627308670962,
			switch_language: false,
			uid: userOne,
			set_owner: userOne,
			mode: "questions",
		});

		const returnAfterIncorrect = await processAnswer(secondTermAnswerTwoRequestData);

		const snapAfterIncorrectData = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfterIncorrectData, hamjest.anyOf(
			hamjest.is({
				correct: [],
				current_correct: [],
				duration: null,
				incorrect: [vocabOne],
				progress: 1,
				questions: [
					vocabOne,
					vocabOne,
					vocabTwo
				],
				set_title: setOne,
				start_time: 1627308670962,
				switch_language: false,
				uid: userOne,
				set_owner: userOne,
				mode: "questions",
			}),
			hamjest.is({
				correct: [],
				current_correct: [],
				duration: null,
				incorrect: [vocabOne],
				progress: 1,
				questions: [
					vocabOne,
					vocabTwo,
					vocabOne
				],
				set_title: setOne,
				start_time: 1627308670962,
				switch_language: false,
				uid: userOne,
				set_owner: userOne,
				mode: "questions",
			})
		));

		if (returnAfterIncorrect.nextPrompt.item === "term_01") {
			await processAnswer(firstTermAnswerOneRequestData);
			await processAnswer(firstTermAnswerTwoRequestData);
			await processAnswer(secondTermAnswerOneRequestData);
			await processAnswer(secondTermAnswerTwoRequestData);
		} else {
			await processAnswer(secondTermAnswerOneRequestData);
			await processAnswer(secondTermAnswerTwoRequestData);
			await processAnswer(firstTermAnswerOneRequestData);
			await processAnswer(firstTermAnswerTwoRequestData);
		}

		const snapAfterCorrectData = await progressDocId.get().then((doc) => {
			return doc.data();
		});

		hamjest.assertThat(snapAfterCorrectData.correct, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_02"]),
			hamjest.is(["vocab_02", "vocab_01"])
		));
		hamjest.assertThat(snapAfterCorrectData.questions, hamjest.anyOf(
			hamjest.is(["vocab_01", "vocab_01", "vocab_02"]),
			hamjest.is(["vocab_01", "vocab_02", "vocab_01"])
		));
		assert.deepStrictEqual(snapAfterCorrectData.incorrect, [vocabOne]);
		assert.deepStrictEqual(snapAfterCorrectData.current_correct, []);
		assert.notStrictEqual(snapAfterCorrectData.duration, null);
		assert.strictEqual(snapAfterCorrectData.progress, 3);
		assert.strictEqual(snapAfterCorrectData.set_title, setOne);
		assert.strictEqual(snapAfterCorrectData.start_time, 1627308670962);
		assert.strictEqual(snapAfterCorrectData.switch_language, false);
		assert.strictEqual(snapAfterCorrectData.uid, userOne);
		assert.strictEqual(snapAfterCorrectData.set_owner, userOne);
		assert.strictEqual(snapAfterCorrectData.mode, "questions");
	}).timeout(5000);

	it("processAnswer ignores punctuation", async () => {
		const processAnswer = test.wrap(cloudFunctions.processAnswer);

		const progressData = {
			correct: [],
			current_correct: [],
			duration: null,
			incorrect: [],
			progress: 0,
			questions: [
				vocabOne,
				vocabTwo
			],
			set_title: setOne,
			start_time: 1627308670962,
			switch_language: false,
			uid: userOne,
			set_owner: userOne,
			mode: "questions",
		};
		const termDataOne = {
			"item": termOne,
			"sound": soundOne,
		};
		const termDataTwo = {
			"item": termTwo,
			"sound": soundTwo,
		};
		const definitionDataOne = {
			"item": punctuationDefinitionOne,
		};
		const definitionDataTwo = {
			"item": definitionTwo,
		};

		const progressId = "progress_01";
		const progressDocId = firestore.collection("progress").doc(progressId);

		await progressDocId.set(progressData);
		await progressDocId.collection("terms").doc(vocabOne)
			.set(termDataOne);
		await progressDocId.collection("terms").doc(vocabTwo)
			.set(termDataTwo);
		await progressDocId.collection("definitions").doc(vocabOne)
			.set(definitionDataOne);
		await progressDocId.collection("definitions").doc(vocabTwo)
			.set(definitionDataTwo);

		const requestData = {
			progressId: progressId,
			answer: "definition\"'_-)(,.0 1",
		};

		const returnedData = await processAnswer(requestData);

		assert.equal(returnedData.correct, true);
	});

	it("setAdmin can change other users' admin states", async () => {
		// NOTE: admin uid is M3JPrFRH6Fdo8XMUbF0l2zVZUCH3
		
		const setAdmin = test.wrap(cloudFunctions.setAdmin);
		
		const targetId = await admin.auth().createUser({
			email: "user_01@mgrove.uk",
			password: "user1234",
		}).then((user) => {
			return user.uid;
		});

		await firebase.assertSucceeds(setAdmin({
			targetUser: targetId,
			adminState: true,
		}));

		await admin.auth().deleteUser(targetId);
	});

	it("setAdmin can't change current user's admin state", async () => {
		/** NOTE
		 * Admin uid is M3JPrFRH6Fdo8XMUbF0l2zVZUCH3.
		 * This uid should be set in the function's code during testing.
		*/

		const setAdmin = test.wrap(cloudFunctions.setAdmin);

		const targetId = "M3JPrFRH6Fdo8XMUbF0l2zVZUCH3"

		await firebase.assertFails(setAdmin({
			targetUser: targetId,
			adminState: false,
		}));
	});

	it("addSetToGroup can add existing set to existing group", async () => {
		const addSetToGroup = test.wrap(cloudFunctions.addSetToGroup);

		const setDataOne = {
			"owner": userOne,
			"public": true,
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
		let groupUsers = {};
		groupUsers[userOne] = "owner";
		const groupDataOne = {
			"display_name": groupOne,
			"join_code": "abcd1234",
			"sets": [],
			"users": groupUsers,
		};
		const userGroupDataOne = {
			role: "owner",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		await firebase.assertSucceeds(addSetToGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("addSetToGroup can't add existing set that's not public and isn't theirs to existing group", async () => {
		const addSetToGroup = test.wrap(cloudFunctions.addSetToGroup);

		const setDataOne = {
			"owner": userTwo,
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
		let groupUsers = {};
		groupUsers[userOne] = "owner";
		const groupDataOne = {
			"display_name": groupOne,
			"join_code": "abcd1234",
			"sets": [],
			"users": groupUsers,
		};
		const userGroupDataOne = {
			role: "owner",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		await firebase.assertFails(addSetToGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("addSetToGroup can't add existing set to existing group when their role is member and they aren't admin", async () => {
		const addSetToGroup = test.wrap(cloudFunctions.addSetToGroup);

		const setDataOne = {
			"owner": userOne,
			"public": true,
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
		let groupUsers = {};
		groupUsers[userOne] = "member";
		const groupDataOne = {
			"display_name": groupOne,
			"join_code": "abcd1234",
			"sets": [],
			"users": groupUsers,
		};
		const userGroupDataOne = {
			role: "member",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		await firebase.assertFails(addSetToGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("removeSetFromGroup can remove existing set from existing group it is already a part of when group owner", async () => {
		const removeSetFromGroup = test.wrap(cloudFunctions.removeSetFromGroup);

		const setDataOne = {
			owner: userOne,
			public: true,
			title: setOne,
			groups: [groupOne],
		};
		const vocabDataOne = {
			term: termOne,
			definition: definitionOne,
			sound: soundOne,
		};
		const vocabDataTwo = {
			term: termTwo,
			definition: definitionTwo,
			sound: soundTwo,
		};
		let groupUsers = {};
		groupUsers[userOne] = "owner";
		const groupDataOne = {
			display_name: groupOne,
			join_code: "abcd1234",
			sets: [setOne],
			users: groupUsers,
		};
		const userGroupDataOne = {
			role: "owner",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		firebase.assertSucceeds(removeSetFromGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("removeSetFromGroup can't remove existing set from existing group it is already a part of when not group owner", async () => {
		const removeSetFromGroup = test.wrap(cloudFunctions.removeSetFromGroup);

		const setDataOne = {
			owner: userOne,
			public: true,
			title: setOne,
			groups: [groupOne],
		};
		const vocabDataOne = {
			term: termOne,
			definition: definitionOne,
			sound: soundOne,
		};
		const vocabDataTwo = {
			term: termTwo,
			definition: definitionTwo,
			sound: soundTwo,
		};
		let groupUsers = {};
		groupUsers[userOne] = "collaborator";
		const groupDataOne = {
			display_name: groupOne,
			join_code: "abcd1234",
			sets: [setOne],
			users: groupUsers,
		};
		const userGroupDataOne = {
			role: "collaborator",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		firebase.assertFails(removeSetFromGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("removeSetFromGroup can't remove existing set from existing group it is not already a part of when group owner", async () => {
		const removeSetFromGroup = test.wrap(cloudFunctions.removeSetFromGroup);

		const setDataOne = {
			owner: userOne,
			public: true,
			title: setOne,
			groups: [],
		};
		const vocabDataOne = {
			term: termOne,
			definition: definitionOne,
			sound: soundOne,
		};
		const vocabDataTwo = {
			term: termTwo,
			definition: definitionTwo,
			sound: soundTwo,
		};
		let groupUsers = {};
		groupUsers[userOne] = "owner";
		const groupDataOne = {
			display_name: groupOne,
			join_code: "abcd1234",
			sets: [],
			users: groupUsers,
		};
		const userGroupDataOne = {
			role: "owner",
		};

		await firestore.collection("sets").doc(setOne).set(setDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabOne).set(vocabDataOne);
		await firestore.collection("sets").doc(setOne)
			.collection("vocab").doc(vocabTwo).set(vocabDataTwo);
		await firestore.collection("groups").doc(groupOne).set(groupDataOne);
		await firestore.collection("users").doc(userOne)
			.collection("groups").doc(groupOne).set(userGroupDataOne);

		firebase.assertFails(removeSetFromGroup({
			groupId: groupOne,
			setId: setOne,
		}));
	});

	it("createGroup can create new group", async () => {
		const createGroup = test.wrap(cloudFunctions.createGroup);

		
		const groupId = await createGroup(groupOne);
		const groupDocId = firestore.collection("groups").doc(groupId);
		const userGroupDocId = firestore.collection("users").doc(userOne).collection("groups").doc(groupId);

		const snapGroupAfter = await groupDocId.get().then((doc) => {
			return doc.data();
		});

		const snapUserGroupAfter = await userGroupDocId.get().then((doc) => {
			return doc.data();
		});
		
		assert.strictEqual(snapGroupAfter.display_name, groupOne);
		assert.deepStrictEqual(snapGroupAfter.sets, []);
		assert.deepStrictEqual(snapGroupAfter.users, {});
		assert.notStrictEqual(snapGroupAfter.join_code, null);
		assert.deepStrictEqual(snapUserGroupAfter, {role: "owner"});
	});
});