/* eslint-disable indent */
/* eslint-disable no-tabs */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Randomises the items in an array.
 * @param {object} array The array to randomise.
 * @return {object} The randomised array.
 */
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

/**
 * Adds extra user info when new user created.
 * @return {promise} Promise from database write.
 */
exports.userCreated = functions.auth.user().onCreate(async (user) => {
	return await admin.auth().setCustomUserClaims(user.uid, {
		admin: false,
	}).then(() => {
		return db.collection("users").doc(user.uid).set({
			sound: true,
			theme: "default",
		});
	});
});

/**
 * Cleans up database when user deleted. Progress documents are kept as they may provide useful metrics.
 * @return {promise} Promise from database delete.
 */
exports.userDeleted = functions.auth.user().onDelete(async (user) => {
	return db.collection("users").doc(user.uid).delete();
});

/**
 * Creates new progress document.
 * @param {object} data The data passed to the function.
 * @param {string} data.set_id The ID of the desired set.
 * @param {boolean} data.switch_language Whether or not the languages should be reversed.
 * @return {string} progressId The ID of the created progress document.
*/
exports.createProgress = functions.https.onCall((data, context) => {
	// const uid = context.auth.uid;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";

	const switchLanguage = data.switch_language;
	const setId = data.set_id;

	const correct = [];
	const incorrect = [];
	const mark = 0;
	const progress = 0;
	const startTime = Date.now();

	const setDocId = db.collection("sets").doc(setId);
	const setVocabCollectionId = db
		.collection("sets").doc(setId)
		.collection("vocab");
	const progressDocId = db
		.collection("progress").doc();


	return db.runTransaction((transaction) => {
		return transaction.get(setDocId).then((setDoc) => {
			if (!setDoc.exists) {
				throw new functions.https.HttpsError("not-found", "Set doesn't exist");
			} else {
				const setTitle = setDoc.data().title;

				return transaction.get(setVocabCollectionId).then((setVocab) => {
					let questions = [];

					setVocab.forEach((doc) => {
						const vocabId = doc.id;

						const terms = {
							"item": doc.data().term,
							"sound": doc.data().sound,
						};
						const definitions = {
							"item": doc.data().definition,
						};

						questions.push(vocabId);

						transaction.set(
							progressDocId.collection("terms").doc(vocabId),
							terms
						);
						transaction.set(
							progressDocId.collection("definitions").doc(vocabId),
							definitions
						);
					});

					transaction.set(
						progressDocId,
						{
							questions: shuffleArray(questions),
							correct: correct,
							incorrect: incorrect,
							mark: mark,
							progress: progress,
							start_time: startTime,
							set_title: setTitle,
							uid: uid,
							switch_language: switchLanguage,
							duration: null,
						}
					);

					return {
						progressId: progressDocId.id,
					};
				});
			}
		});
	});
});

/**
 * Processes a response to a question in a vocab set.
 * @param {string} progressId The ID of the progress file to retrieve the prompt from.
 * @return {string} item The term/definition prompt for the next question.
 * @return {string} sound The file ID for the next question's sound file. Null if language is switched.
 *//*
exports.getPrompt = functions.https.onCall((data, context) => {
	// const uid = context.auth.uid;
	const uid = "user_01";

	const progressId = data;
	
	const progressDocId = db
		.collection("progress").doc(progressId);
	
	return db.runTransaction((transaction) => {
		return transaction.get(progressDocId).then((progressDoc) => {
			if (uid !== progressDoc.data().uid) {
				throw new functions.https.HttpsError("permission-denied", "Wrong user's progress");
			} else if (progressDoc.data().progress >= progressDoc.data().questions.length) {
				throw new functions.https.HttpsError("permission-denied", "Progress already completed")
			} else {
				nextIndex = progressDoc.data().progress;
				nextVocabId = progressDoc.data().questions[nextIndex];

				if (progressDoc.data().switch_language) {
					const promptDocId = progressDocId
						.collection("definitions").doc(nextVocabId);
					const sound = null;

					return transaction.get(promptDocId).then((promptDoc) => {
						return {
							item: promptDoc.data().item,
							sound: sound,
						}
					});
				} else {
					const promptDocId = progressDocId
						.collection("terms").doc(nextVocabId);

					return transaction.get(promptDocId).then((promptDoc) => {
						const sound = promptDoc.data().sound;
						return {
							item: promptDoc.data().item,
							sound: sound,
						}
					});
				}
			}
		});
	});
});*/

/**
 * Processes a response to a question in a vocab set.
 * @param {object} data The data passed to the function.
 * @param {string} data.progressId The ID of the progress document to update.
 * @param {string} data.answer The answer given by the user to the current prompt.
 * @return {boolean} correct Whether the provided answer was correct.
 * @return {array} correctAnswers An array of correct answers for the question just answered.
 * @return {object} nextPrompt Details of the next prompt, if relevant. Null if last question has been answered.
 * @return {string} nextPrompt.item The term/definition prompt for the next question.
 * @return {string} nextPrompt.sound The file ID for the next question's sound file. Null if language is switched.
 * @return {integer} progress Total number of questions answered so far.
 * @return {integer} totalQuestions Total number of questions in the set (including duplicates after incorrect answers).
 * @return {integer} totalCorrect Total number of correct answers so far.
 * @return {integer} totalIncorrect Total number of incorrect answers so far.
 */
exports.processAnswer = functions.https.onCall((data, context) => {
	// const uid = context.auth.uid;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";

	const progressId = data.progressId;
	const inputAnswer = data.answer;
	
	const progressDocId = db
		.collection("progress").doc(progressId);

	return db.runTransaction((transaction) => {
		return transaction.get(progressDocId).then((progressDoc) => {
			if (uid !== progressDoc.data().uid) {
				throw new functions.https.HttpsError("permission-denied", "Wrong user's progress");
			} else if (progressDoc.data().progress >= progressDoc.data().questions.length) {
				throw new functions.https.HttpsError("permission-denied", "Progress already completed")
			} else {
				currentIndex = progressDoc.data().progress;
				currentVocab = progressDoc.data().questions[currentIndex];

				let answerDocId;

				if (progressDoc.data().switch_language) {
					answerDocId = progressDocId
						.collection("terms").doc(currentVocab);
				} else {
					answerDocId = progressDocId
						.collection("definitions").doc(currentVocab);
				}

				return transaction.get(answerDocId).then((answerDoc) => {
					// TODO: rename due to conflict with var passed to cloud fn
					const data = progressDoc.data();
					const correctAnswers = answerDoc.data().item;
					const splitCorrectAnswers = correctAnswers.replace(" ", "").split("/");
					const isCorrectAnswer = splitCorrectAnswers.includes(inputAnswer.replace(" ", ""));
					
					data.progress++;
					
					if (isCorrectAnswer) {
						data.correct.push(currentVocab);
					} else {
						data.incorrect.push(currentVocab);
						data.questions.push(currentVocab);
						const doneQuestions = data.questions.slice(0,data.progress);
						const notDoneQuestions = data.questions.slice(data.progress);
						data.questions = doneQuestions.concat(shuffleArray(notDoneQuestions));
					}

					var returnData = {
						correct: isCorrectAnswer,
						correctAnswers: splitCorrectAnswers,
						nextPrompt: null,
						progress: data.progress,
						totalQuestions: data.questions.length,
						totalCorrect: data.correct.length,
						totalIncorrect: data.incorrect.length,
					}

					if (data.progress >= data.questions.length) {
						const duration = Date.now() - data.start_time;
						data.duration = duration;
						returnData.duration = duration;
						console.log("duration: " + data.duration + " // start time: " + data.start_time);
						transaction.set(progressDocId, data);
						return returnData;
					} else {
						const nextVocabId = data.questions[data.progress];

						if (data.switch_language) {
							const promptDocId = progressDocId
								.collection("definitions").doc(nextVocabId);
							const sound = null;

							return transaction.get(promptDocId).then((promptDoc) => {
								returnData.nextPrompt = {
									item: promptDoc.data().item,
									sound: sound,
								}
								transaction.set(progressDocId, data);
								return returnData;
							});
						} else {
							const promptDocId = progressDocId
								.collection("terms").doc(nextVocabId);

							return transaction.get(promptDocId).then((promptDoc) => {
								const sound = promptDoc.data().sound;
								returnData.nextPrompt = {
									item: promptDoc.data().item,
									sound: sound,
								}
								transaction.set(progressDocId, data);
								return returnData;
							});
						}
					}
					
				});
			}
		});
	});
});

/**
 * Sets the admin state of a user (excluding the authenticated user), if the authenticated
 * user is an admin themselves.
 * @param {object} data The data passed to the function.
 * @param {string} data.targetUser The ID of the user whose admin state should be changed.
 * @param {boolean} data.adminState The target admin state.
 * @return {promise} The promise from setting the target user's admin custom auth claim.
*/
exports.setAdmin = functions.https.onCall(async (data, context) => {
	// const uid = context.auth.uid;
	// const admin = context.auth.tokens.admin;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";
	const isAdmin = false;

	const targetUser = data.targetUser;
	const adminState = data.adminState;

	if (isAdmin) {
		if (uid !== targetUser) {
			return await admin.auth().setCustomUserClaims(targetUser, {
				admin: adminState,
			});
		} else {
			throw new functions.https.HttpsError("permission-denied", "Cannot change admin status of authenticated user");
		}
	} else {
		throw new functions.https.HttpsError("permission-denied", "Must be an admin to change other users' admin states");
	}
});

/**
 * Adds an existing vocab set to an existing group.
 * @param {object} data The data passed to the function.
 * @param {string} data.groupId The ID of the group to which the set should be added.
 * @param {boolean} data.setId The ID of the set that should be added to the group.
 * @return {promise} The promise from setting the group's updated data.
*/
exports.addSetToGroup = functions.https.onCall((data, context) => {
	// const uid = context.auth.uid;
	// const isAdmin = context.auth.token.admin;
	// const auth = context.auth;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";
	const isAdmin = true;
	const auth = { uid: uid };

	const groupId = data.groupId;
	const setId = data.setId;
	const setDocId = db.collection("sets").doc(setId);
	const userGroupDocId = db.collection("users").doc(uid).collection("groups").doc(groupId);
	const groupDocId = db.collection("groups").doc(groupId);

	return db.runTransaction((transaction) => {
		return transaction.get(setDocId).then((setDoc) => {
			return transaction.get(userGroupDocId).then((userGroupDoc) => {
				const userRole = userGroupDoc.data().role;
				if (auth && (setDoc.data().public || setDoc.data().owner == uid) && (userRole == "contributor" || userRole == "owner" || isAdmin)) {
					let setDocData = setDoc.data();
					if (setDocData.groups != null && setDocData.groups.includes(groupId)) {
						throw new functions.https.HttpsError("permission-denied", "Set is already part of group");
					} else {
						return transaction.get(groupDocId).then((groupDoc) => {
							let groupDocData = groupDoc.data();
							if (setDocData.groups == null) {
								setDocData.groups = [];
							}
							if (groupDocData.sets == null) {
								groupDocData.sets = [];
							}
							setDocData.groups.push(groupId);
							groupDocData.sets.push(setId);

							transaction.set(
								setDocId,
								setDocData,
							);
							return transaction.set(
								groupDocId,
								groupDocData,
							);
						});
					}
				} else {
					throw new functions.https.HttpsError("permission-denied", "Insufficient permisisons to add set to group")
				}
			});
		});
	});
});

/**
 * Removes an existing vocab set from an existing group.
 * @param {object} data The data passed to the function.
 * @param {string} data.groupId The ID of the group from which the set should be removed.
 * @param {boolean} data.setId The ID of the set that should be removed from the group.
 * @return {promise} The promise from setting the group's updated data.
*/
exports.removeSetFromGroup = functions.https.onCall((data, context) => {
	// const uid = context.auth.uid;
	// const isAdmin = context.auth.token.admin;
	// const auth = context.auth;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";
	const isAdmin = false;
	const auth = { uid: uid };

	const groupId = data.groupId;
	const setId = data.setId;
	const setDocId = db.collection("sets").doc(setId);
	const userGroupDocId = db.collection("users").doc(uid).collection("groups").doc(groupId);
	const groupDocId = db.collection("groups").doc(groupId);

	return db.runTransaction((transaction) => {
		return transaction.get(setDocId).then((setDoc) => {
			return transaction.get(userGroupDocId).then((userGroupDoc) => {
				const userRole = userGroupDoc.data().role;
				console.log(context.auth);
				if (auth && (userRole == "owner" || isAdmin)) {
					let setDocData = setDoc.data();
					if (setDocData.groups == null || !setDocData.groups.includes(groupId)) {
						throw new functions.https.HttpsError("permission-denied", "Set is not part of group");
					} else {
						return transaction.get(groupDocId).then((groupDoc) => {
							setDocData.groups = setDocData.groups.filter(item => item !== groupId);
							let groupDocData = groupDoc.data();
							groupDocData.sets = groupDocData.sets.filter(item => item !== setId);

							transaction.set(
								setDocId,
								setDocData,
							);
							return transaction.set(
								groupDocId,
								groupDocData,
							);
						});
					}
				} else {
					throw new functions.https.HttpsError("permission-denied", "Insufficient permisisons to remove set from group")
				}
			});
		});
	});
});

/**
 * Changes an existing user's membership status of a group in the groups collection
 * in Firestore, after it has been changed in the users collection.
 * @return {promise} The promise from setting the group's updated data.
*/
exports.userGroupRoleChanged = functions.firestore.document("users/{userId}/groups/{groupId}")
	.onWrite((change, context) => {
		return db.runTransaction((transaction) => {
			const groupDocId = db.collection("groups").doc(context.params.groupId);
			return transaction.get(groupDocId).then((groupDoc) => {
				let groupData = groupDoc.data();
				if (typeof groupData === "undefined") {
					throw new functions.https.HttpsError("not-found", "Group doesn't exist");
				}
				if (typeof groupData.users === "undefined") {
					groupData.users = {};
				}
				
				if (change.after.data().role) {
					groupData.users[context.params.userId] = change.after.data().role;
				} else {
					delete groupData.users[context.params.userId];
				}
				return transaction.set(
					groupDocId,
					groupData
				);
			});
		});
	});

/**
 * Generates a random, unused group join code.
 * @return {string} The join code.
*/
async function generateJoinCode() {
	const joinCode = String(Math.random().toString(36).substring(5));
	const snapshot = await db.collection("join_codes").doc(joinCode).get();

	if (snapshot.exists) {
		return generateJoinCode();
	} else {
		console.log("RETURNING");
		return joinCode;
	}
}

/**
 * Creates a new group.
 * @param {string} data The display name for the new group.
 * @return {string} The ID of the new group's document in the groups collection.
*/
exports.createGroup = functions.https.onCall(async (data, context) => {
	// const uid = context.auth.uid;
	const uid = "W3eFM5CcDqtocwQ37QGOQSCaWFFj";

	const joinCode = await generateJoinCode();

	const groupDoc = await db.collection("groups").add({
		display_name: data,
		sets: [],
		users: {},
		join_code: joinCode,
	});

	await db.collection("users").doc(uid).collection("groups").doc(groupDoc.id).set({
		role: "owner",
	});

	return groupDoc.id;
});

/**
 * Cleans up database after group is deleted - removes group references from user groups collections.
 * @return {promise} The promise from deleting the user's group data.
*/
exports.groupDeleted = functions.firestore.document("groups/{groupId}")
	.onDelete(async (snap, context) => {
		let batch = db.batch();
		const users = snap.data().users;
		const joinCode = snap.data().join_code;

		let counter = 0;
		for (let [userId, role] of Object.entries(users)) {
			batch.delete(
				db.collection("users").doc(userId).collection("groups").doc(context.params.groupId)
			);
			counter++;
			if (counter >= 19) {
				batch.commit();
				batch = db.batch();
			}
		}

		batch.delete(db.collection("join_codes").doc(joinCode));

		return await batch.commit();
	});

/**
 * Cleans up database after group is deleted - removes group references from user groups collections.
 * @return {boolean} Returns true on completion.
*/
exports.progressDeleted = functions.firestore.document("progress/{progressId}")
	.onDelete((snap, context) => {
		deleteCollection(
			db,
			"/progress/" + context.params.progressId + "/terms",
			500
		);
		deleteCollection(
			db,
			"/progress/" + context.params.progressId + "/definitions",
			500
		);
		return true;
	});

/**
 * Deletes a Firestore collection.
 * @param {FirebaseFirestore.Firestore} db The database object from which the collection should be deleted.
 * @param {string} collectionPath The path of the collection to be deleted.
 * @param {integer} batchSize The maximum batch size.
 * @return {promise} A promise with the result of the deleteQueryBatch function.
*/
async function deleteCollection(db, collectionPath, batchSize) {
	const collectionRef = db.collection(collectionPath);
	const query = collectionRef.orderBy('__name__').limit(batchSize);

	return new Promise((resolve, reject) => {
		deleteQueryBatch(db, query, resolve).catch(reject);
	});
}

async function deleteQueryBatch(db, query, resolve) {
	const snapshot = await query.get();

	const batchSize = snapshot.size;
	if (batchSize === 0) {
		// When there are no documents left, we are done
		resolve();
		return;
	}

	// Delete documents in a batch
	const batch = db.batch();
	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	await batch.commit();

	// Recurse on the next process tick, to avoid
	// exploding the stack.
	process.nextTick(() => {
		deleteQueryBatch(db, query, resolve);
	});
}
