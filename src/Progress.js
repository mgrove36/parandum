import React from 'react';
import { withRouter } from "react-router-dom";
import { HomeRounded as HomeRoundedIcon, ArrowForwardRounded as ArrowForwardRoundedIcon, SettingsRounded as SettingsRoundedIcon, CloseRounded as CloseRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import LinkButton from "./LinkButton";
import Error404 from "./Error404";
import SettingsContent from "./SettingsContent";
import Footer from "./Footer";

import "./css/PopUp.css";
import "./css/Progress.css";

export default withRouter(class Progress extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			functions: {
				processAnswer: props.functions.httpsCallable("processAnswer"),
			},
			loading: false,
			canProceed: true,
			navbarItems: [
				{
					type: "button",
					onClick: this.showSettings,
					icon: <SettingsRoundedIcon />,
					hideTextMobile: true,
				},
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			progressInaccessible: false,
			correct: 0,
			incorrect: 0,
			totalQuestions: 0,
			progress: 0,
			setTitle: "",
			switchLanguage: false,
			answerInput: "",
			currentPrompt: "",
			currentSound: false,
			currentSetOwner: "",
			nextPrompt: "",
			nextSound: false,
			nextSetOwner: "",
			currentAnswerStatus: null,
			currentCorrect: [],
			moreAnswers: true,
			duration: 0,
			incorrectAnswers: {},
			showSettings: false,
			soundInput: this.props.sound,
			themeInput: this.props.theme,
			setIds: [],
			attemptNumber: 1,
		};
		
		let isMounted = true;
		Object.defineProperty(this, "isMounted", {
			get: () => isMounted,
			set: (value) => isMounted = value,
		});
	}

	setState = (state, callback=null) => {
		if (this.isMounted) super.setState(state, callback);
	}

	async componentDidMount() {
		const progressId = this.props.match.params.progressId;
		const progressRef = this.state.db.collection("progress").doc(progressId);
		
		let [ newState, setDone, incorrectAnswers, duration ] = await progressRef.get().then((doc) => {
			const data = doc.data();
			
			document.title = `Study | ${data.set_title} | Parandum`;

			let newState = {
				correct: data.correct.length,
				incorrect: data.incorrect.length,
				totalQuestions: data.questions.length,
				questions: data.questions,
				progress: data.progress,
				setTitle: data.set_title,
				switchLanguage: data.switch_language,
				currentSetOwner: data.set_owner,
				currentCorrect: data.current_correct,
				mode: data.mode,
				nextPrompt: null,
				setIds: data.setIds,
			};

			if (data.lives) {
				newState.lives = data.lives;
			}

			return [ newState, data.duration !== null, data.incorrect, data.duration ];
		}).catch((error) => {
			console.log(`Progress data inaccessible: ${error}`);
			return [
				{
					progressInaccessible: true,
				},
				true
			];
		});

		if (!newState.progressInaccessible && !setDone) {
			let nextPromptRef;
			if (!newState.switchLanguage) {
				nextPromptRef = progressRef
					.collection("terms")
					.doc(newState.questions[newState.progress]);
			} else {
				nextPromptRef = progressRef
					.collection("definitions")
					.doc(newState.questions[newState.progress]);
			}
	
			await nextPromptRef.get().then((doc) => {
				newState.currentPrompt = doc.data().item;
				newState.currentSound = doc.data().sound === true;
			}).catch((error) => {
				newState.progressInaccessible = true;
				console.log(`Progress data inaccessible: ${error}`);
			});
		} else if (setDone) {
			newState.moreAnswers = false;
			newState.currentAnswerStatus = true;
			newState.duration = duration;

			let promises = [];
			
			promises.push(this.state.db.collection("progress")
				.where("uid", "==", this.state.user.uid)
				.where("setIds", "==", newState.setIds)
				.orderBy("start_time")
				.get()
				.then((querySnapshot) => {
					newState.attemptNumber = querySnapshot.docs.map((doc) => doc.id).indexOf(this.props.match.params.progressId) + 1;
				}));

			if (incorrectAnswers.length > 0) {
				newState.incorrectAnswers = {};
				
				promises.push(Promise.all(incorrectAnswers.map((vocabId) => {
					if (newState.incorrectAnswers[vocabId]) {
						return newState.incorrectAnswers[vocabId].count++;
					} else {
						newState.incorrectAnswers[vocabId] = {
							count: 1,
						};

						return Promise.all([
							progressRef.collection("terms")
								.doc(vocabId)
								.get().then((termDoc) => {
									newState.switchLanguage ? newState.incorrectAnswers[vocabId].answer = termDoc.data().item.split("/") : newState.incorrectAnswers[vocabId].prompt = termDoc.data().item;
								}),
							progressRef.collection("definitions")
								.doc(vocabId)
								.get().then((definitionDoc) => {
									newState.switchLanguage ? newState.incorrectAnswers[vocabId].prompt = definitionDoc.data().item : newState.incorrectAnswers[vocabId].answer = definitionDoc.data().item.split("/");
								})
						]);
					}
				})).catch((error) => {
					console.log(`Couldn't retrieve incorrect answers: ${error}`);
				}));
			}

			await Promise.all(promises);
		}

		this.setState(newState, () => {
			if (!setDone) this.answerInput.focus()
		});
	}

	componentWillUnmount() {
		this.isMounted = false;
	}

	showSettings = () => {
		this.setState({
			showSettings: true,
		});
	}

	handleSoundInputChange = (event) => {
		this.setState({
			soundInput: event.target.checked,
		});
	}

	handleThemeInputChange = (newTheme) => {
		if (this.state.themeInput !== newTheme) this.setState({
			themeInput: newTheme,
		});
	}

	saveSettings = (globalChange) => {
		this.props.handleSoundChange(this.state.soundInput, globalChange);
		this.props.handleThemeChange(this.state.themeInput, globalChange);
		this.hideSettings();
	}

	hideSettings = () => {
		this.setState({
			showSettings: false,
		});
	}

	handleAnswerInput = (event) => {
		this.setState({
			answerInput: event.target.value,
		});
	}

	showNextItem = () => {
		if (this.state.canProceed) {
			if (this.state.currentAnswerStatus === null) {
				this.processAnswer();
			} else {
				this.nextQuestion();
			}
		}
	}

	startLoading = () => {
		this.setState({
			loading: true,
			canProceed: false,
		});
	}

	cleanseVocabString = (item) => {
		const chars = " .,()-_'\"";

		let newString = item;

		chars.split("").forEach((char) => {
			newString = newString.replace(char, "");
		});

		return newString;
	}

	processAnswer = async () => {
		if (this.state.canProceed) {
			const cleansedCurrentCorrect = this.state.currentCorrect.map(item => this.cleanseVocabString(item));
	
			this.startLoading();
	
			if (!cleansedCurrentCorrect.includes(this.cleanseVocabString(this.state.answerInput))) {
				this.state.functions.processAnswer({
					answer: this.state.answerInput,
					progressId: this.props.match.params.progressId,
				}).then(async (result) => {
					const data = result.data;
					let newState = {
						currentAnswerStatus: data.correct,
						currentCorrect: data.correctAnswers,
						moreAnswers: data.moreAnswers,
						nextPrompt: data.nextPrompt ? data.nextPrompt.item : null,
						nextSound: data.nextPrompt ? data.nextPrompt.sound : null,
						nextSetOwner: data.nextPrompt ? data.nextPrompt.set_owner : null,
						progress: data.progress,
						totalQuestions: data.totalQuestions,
						correct: data.totalCorrect,
						incorrect: data.totalIncorrect,
						currentVocabId: data.currentVocabId,
						loading: false,
						canProceed: true,
					};
	
					if (data.correct && !data.moreAnswers && this.state.incorrectAnswers[data.currentVocabId]) {
						// all answers to question given correctly
						// answer was previously wrong
						// store correct answer
						newState.incorrectAnswers = this.state.incorrectAnswers;
						newState.incorrectAnswers[data.currentVocabId].answer = data.correctAnswers;
					} else if (!data.correct) {
						// incorrect answer given
						// store prompt and count=0
						newState.incorrectAnswers = this.state.incorrectAnswers;
						newState.incorrectAnswers[data.currentVocabId] = {
							prompt: this.state.currentPrompt,
							answer: "",
							count: 0,
						};
					}

					let promises = [];

					if (data.duration) {
						// test done
						newState.duration = data.duration;

						promises.push(this.state.db.collection("progress")
							.where("uid", "==", this.state.user.uid)
							.where("setIds", "==", this.state.setIds)
							.orderBy("start_time")
							.get()
							.then((querySnapshot) => {
								console.log(querySnapshot);
								newState.attemptNumber = querySnapshot.docs.map((doc) => doc.id).indexOf(this.props.match.params.progressId) + 1;
							}));
					}

					if (data.incorrectAnswers) {
						let unsavedAnswers = {};

						if (!newState.incorrectAnswers) {
							newState.incorrectAnswers = {};
						}

						data.incorrectAnswers.map((vocabId) => {
							if (newState.incorrectAnswers[vocabId]) {
								// already been logged including prompt and correct answer
								newState.incorrectAnswers[vocabId].count++;
							} else {
								// not been saved yet
								// update count in unsaved answers
								unsavedAnswers[vocabId] ? unsavedAnswers[vocabId]++ : unsavedAnswers[vocabId] = 1;
							}
							return true;
						});

						promises.push(Promise.all(Object.keys(unsavedAnswers).map((vocabId) => {
							// get and store vocab docs that haven't already been stored (due to refresh)
							const progressDocRef = this.state.db
								.collection("progress")
								.doc(this.props.match.params.progressId);

							newState.incorrectAnswers[vocabId] = {
								count: unsavedAnswers[vocabId],
							};

							return Promise.all([
								progressDocRef.collection("terms")
									.doc(vocabId)
									.get().then((termDoc) => {
										this.state.switchLanguage ? newState.incorrectAnswers[vocabId].answer = termDoc.data().item.split("/") : newState.incorrectAnswers[vocabId].prompt = termDoc.data().item;
									}),
								progressDocRef.collection("definitions")
									.doc(vocabId)
									.get().then((definitionDoc) => {
										this.state.switchLanguage ? newState.incorrectAnswers[vocabId].prompt = definitionDoc.data().item : newState.incorrectAnswers[vocabId].answer = definitionDoc.data().item.split("/");
									})
							]);
						})));
					}

					await Promise.all(promises);
	
					this.setState(newState);
				}).catch((error) => {
					console.log(`Couldn't process answer: ${error}`);
					this.setState({
						loading: false,
						canProceed: true,
					});
				});
			} else {
				this.setState({
					currentAnswerStatus: null,
					answerInput: "",
					loading: false,
					canProceed: true,
				});
			}
		}
	}

	nextQuestion = () => {
		if (this.state.canProceed) {
			this.startLoading();
	
			let newState = {
				currentAnswerStatus: null,
				answerInput: "",
				loading: false,
				canProceed: true,
			};
	
			if (!this.state.moreAnswers) {
				newState.currentCorrect = [];
				newState.currentPrompt = this.state.nextPrompt;
				newState.currentSound = this.state.nextSound;
				newState.currentSetOwner = this.state.nextSetOwner;
			}
			
			this.setState(newState, () => (this.isMounted) && this.answerInput.focus());
		}
	}

	msToTime = (time) => {
		const localeData = {
			minimumIntegerDigits: 2,
			useGrouping: false,
		};
		const seconds = Math.floor((time / 1000) % 60).toLocaleString("en-GB", localeData);
		const minutes = Math.floor((time / 1000 / 60) % 60).toLocaleString("en-GB", localeData);
		const hours = Math.floor(time / 1000 / 60 / 60).toLocaleString("en-GB", localeData);

		return `${hours}:${minutes}:${seconds}`;
	}

	render() {
		return (
			<div>
			{
				this.state.progressInaccessible
				?
				<Error404 />
				:
				<>
					<NavBar items={this.state.navbarItems} />
					<main>
						{
							this.state.currentAnswerStatus === null
							?
							<>
								<p className="current-prompt">{this.state.currentPrompt}</p>
								<form className="answer-input-container" onSubmit={(e) => e.preventDefault()} >
									<input type="submit" className="form-submit" onClick={this.showNextItem} />
									<input
										type="text"
										name="answer_input"
										className="answer-input"
										onChange={this.handleAnswerInput}
										value={this.state.answerInput}
										ref={inputEl => (this.answerInput = inputEl)}
									/>
									<Button
										onClick={() => this.processAnswer()}
										icon={<ArrowForwardRoundedIcon />}
										className="button--round"
										disabled={!this.state.canProceed}
										loading={this.state.loading}
									></Button>
								</form>
									<div className="correct-answers">
										{
											this.state.currentCorrect && this.state.currentCorrect.length > 0
												?
												<>
													<h2>
														{
															this.state.moreAnswers
																?
																"Correct so far:"
																:
																"Answers:"
														}
													</h2>
													{this.state.currentCorrect.map((vocab, index) =>
														<p key={index}>{vocab}</p>
													)}
												</>
												:
												""
										}
									</div>
							</>
							:
							this.state.nextPrompt === null && !this.state.moreAnswers
							?
							<>
								{/* DONE */}
								<h1>{this.state.setTitle}</h1>
								<div className="stat-row stat-row--inline">
									<p>You got</p>
									<h1>{`${(this.state.correct / this.state.totalQuestions * 100).toFixed(2)}%`}</h1>
								</div>
								<div className="stat-row stat-row--inline">
									<h1>{`${this.state.correct} of ${this.state.totalQuestions}`}</h1>
									<p>marks</p>
								</div>
								<div className="stat-row stat-row--inline">
									<p>You took</p>
									<h1>{this.msToTime(this.state.duration)}</h1>
								</div>
								<div className="stat-row stat-row--inline stat-row--no-gap">
									<p>Attempt #</p>
									<h1>{this.state.attemptNumber}</h1>
								</div>
								{
									this.state.incorrectAnswers && Object.keys(this.state.incorrectAnswers).length > 0 &&
									<>
										<h2>Incorrect answers:</h2>
										<div className="progress-end-incorrect-answers">
											<div>
												<h3>Prompt</h3>
												<h3>Answer</h3>
												<h3>Mistakes</h3>
											</div>
											{
												Object.keys(this.state.incorrectAnswers).map(key =>
													[key, this.state.incorrectAnswers[key].count])
														.sort((a,b) => b[1] - a[1]).map(item =>
															<div key={item[0]}>
																<p>{this.state.incorrectAnswers[item[0]].prompt ? this.state.incorrectAnswers[item[0]].prompt : ""}</p>
																<p>{this.state.incorrectAnswers[item[0]].answer ? this.state.incorrectAnswers[item[0]].answer.join("/") : ""}</p>
																<p>{this.state.incorrectAnswers[item[0]].count}</p>
															</div>
												)
											}
										</div>
									</>
								}
								{/* TODO: provide the attempt number -- .get() where array-contains-all array of setIds from original sets? would mean a new field in db and adjusting cloud fns again */}
								
								<div className="progress-end-button-container">
									<LinkButton
										to="/"
										className="progress-end-button"
									>
										Done
									</LinkButton>
								</div>
							</>
							:
							<>
								{/* ANSWER PROCESSED */}
								<p className="current-prompt">{this.state.currentPrompt}</p>
												<form className="answer-input-container answer-input-container--answer-entered" onSubmit={(e) => e.preventDefault()} >
									<input type="submit" className="form-submit" onClick={this.showNextItem} />
									<input
										type="text"
										name="answer_input"
										className={`answer-input ${this.state.currentAnswerStatus ? "answer-input--correct" : "answer-input--incorrect"}`}
										value={this.state.answerInput}
										readOnly
									/>
									<Button
										onClick={() => this.nextQuestion()}
										icon={<ArrowForwardRoundedIcon />}
										className="button--round"
										disabled={!this.state.canProceed}
										loading={this.state.loading}
									></Button>
								</form>
								<div className={`correct-answers ${this.state.currentAnswerStatus ? "correct-answers--correct" : "correct-answers--incorrect"}`}>
									{
										this.state.currentCorrect
										?
										<>
											<h2>
												{
													this.state.moreAnswers
													?
													"Correct so far:"
													:
													"Answers:"
												}
											</h2>
											{this.state.currentCorrect.map((vocab, index) => 
												<p key={index}>{vocab}</p>
											)}
										</>
										:
										""
									}
								</div>
							</>
						}
					</main>
					<Footer />

					{
						this.state.showSettings &&
						<>
							<div className="overlay" onClick={this.hideSettings}></div>
							<div className="overlay-content progress-settings-overlay-content">
								<SettingsContent
									sound={this.props.sound}
									theme={this.props.theme}
									saveSettings={this.saveSettings}
									handleSoundInputChange={this.handleSoundInputChange}
									handleThemeInputChange={this.handleThemeInputChange}
									themes={this.props.themes}
									soundInput={this.state.soundInput}
									themeInput={this.state.themeInput}
								/>


								<div className="settings-save-container">
									<Button
										onClick={() => this.saveSettings(true)}
									>
										Save
									</Button>
									<Button
										onClick={() => this.saveSettings(false)}
									>
										Save for this session
									</Button>
								</div>

								<Button
									onClick={this.hideSettings}
									icon={<CloseRoundedIcon />}
									className="button--no-background popup-close-button"
								></Button>
							</div>
						</>
					}
				</>
			}
			</div>
		)
	}
})
