import React, { Component } from 'react';
import { withRouter, Prompt } from "react-router-dom";
import { HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import Error404 from "./Error404";
import Footer from "./Footer";
import Checkbox from '@material-ui/core/Checkbox';

export default withRouter(class EditSet extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			loading: false,
			canSaveSet: !(props.createSet === true),
			inputs: {
				title: "",
				public: false,
			},
			inputContents: [],
			originalInputContents: [],
			setInaccessible: false,
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			canMakeSetNonPublic: true,
			changesMade: false,
			totalCompliantVocabPairs: 0,
			totalUncompliantVocabPairs: 0,
		};

		let isMounted = true;
		Object.defineProperty(this, "isMounted", {
			get: () => isMounted,
			set: (value) => isMounted = value,
		});
	}

	setState = (state, callback = null) => {
		if (this.isMounted) super.setState(state, callback);
	}

	alertLeavingWithoutSaving = (e = null) => {
		if (this.state.canSaveSet && this.state.changesMade) {
			var confirmationMessage = "Are you sure you want to leave? You will lose any unsaved changes.";
	
			(e || window.event).returnValue = confirmationMessage; //Gecko + IE
			return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		}
		return "";
	}

	async componentDidMount() {
		window.addEventListener("beforeunload", this.alertLeavingWithoutSaving);

		if (this.props.createSet !== true) {
			const setId = this.props.match.params.setId;
			const setRef = this.state.db.collection("sets")
				.doc(setId);
			const setVocabRef = setRef.collection("vocab")
				.orderBy("term");

			await setRef.get().then(async (setDoc) => {
				document.title = `Edit | ${setDoc.data().title} | Parandum`;

				await setVocabRef.get().then((querySnapshot) => {
					let vocab = [];

					querySnapshot.docs.map((doc) => {
						const data = doc.data();

						return vocab.push({
							vocabId: doc.id,
							term: data.term,
							definition: data.definition,
							sound: data.sound,
							validInput: true,
						});
					});

					let newState = {
						inputs: {
							title: setDoc.data().title,
							public: setDoc.data().public,
						},
						inputContents: vocab,
						originalInputContents: JSON.parse(JSON.stringify(vocab)),
						canMakeSetNonPublic: !(setDoc.data().groups && setDoc.data().groups.length > 0),
						totalCompliantVocabPairs: vocab.length,
					};
					
					if (setDoc.data().owner !== this.state.user.uid) {
						newState.setInaccessible = true;
					}

					this.setState(newState);
				});
			}).catch(() => {
				this.setState({
					setInaccessible: true,
				});
			});

			this.props.logEvent("select_content", {
				content_type: "edit_set",
				item_id: this.props.match.params.setId,
			});
		} else {
			document.title = "Create Set | Parandum";

			this.props.logEvent("page_view");
		}

		!this.state.setInaccessible && this.setNameInput.focus();
		this.props.page.load();
	}

	componentWillUnmount = () => {
		window.removeEventListener('beforeunload', this.alertLeavingWithoutSaving);
		this.isMounted = false;
		this.props.page.unload();
	}

	stopLoading = (changesMade=this.state.changesMade) => {
		this.setState({
			canSaveSet: true,
			loading: false,
			changesMade,
		});
	}

	cleanseVocabString = (item) => {
		const chars = /[\p{P}\p{S} ]+/ug;
		return item.replace(chars, "");
	}

	handleSetDataChange = (vocabIndex=null) => {
		let inputContents = [...this.state.inputContents];
		let totalCompliantVocabPairs = this.state.totalCompliantVocabPairs;
		let totalUncompliantVocabPairs = this.state.totalUncompliantVocabPairs;

		if (vocabIndex !== null) {
			const emptyTerm = this.cleanseVocabString(inputContents[vocabIndex].term) === "";
			const emptyDefinition = this.cleanseVocabString(inputContents[vocabIndex].definition) === "";
			let oldCompliance = inputContents[vocabIndex].validInput;
			
			if (oldCompliance === false) {
				totalUncompliantVocabPairs--;
			} else if (oldCompliance === true) {
				totalCompliantVocabPairs--;
			}

			if (emptyTerm ? !emptyDefinition : emptyDefinition) {
				inputContents[vocabIndex].validInput = false;
				totalUncompliantVocabPairs++;
			} else if (!emptyTerm && !emptyDefinition) {
				inputContents[vocabIndex].validInput = true;
				totalCompliantVocabPairs++;
			} else {
				inputContents[vocabIndex].validInput = null;
			}
		}

		this.setState({
			canSaveSet: totalUncompliantVocabPairs === 0 && totalCompliantVocabPairs > 0 && this.state.inputs.title.trim() !== "",
			changesMade: true,
			inputContents,
			totalCompliantVocabPairs,
			totalUncompliantVocabPairs,
		});
	}

	onTermInputChange = (event, vocabIndex) => {
		const index = Number(event.target.name.replace("term_", ""));
		const input = event.target.value;

		let inputContents = [...this.state.inputContents];

		if (index >= this.state.inputContents.length && input !== "") {
			inputContents.push({
				term: input,
				definition: "",
				sound: false,
				validInput: null,
			});
		} else {
			if (index === this.state.inputContents.length - 1 && input === "" && this.state.inputContents[index].definition === "") {
				inputContents.splice(-1);
			} else {
				inputContents[index].term = input;
			}
		}

		this.setState({
			inputContents: inputContents,
		}, () => this.handleSetDataChange(vocabIndex));
	}

	onDefinitionInputChange = (event, vocabIndex) => {
		const index = Number(event.target.name.replace("definition_", ""));
		const input = event.target.value;

		let inputContents = this.state.inputContents;

		if (index >= this.state.inputContents.length && input !== "") {
			inputContents.push({
				term: "",
				definition: input,
				sound: false,
				validInput: null,
			});
		} else {
			if (index === this.state.inputContents.length - 1 && input === "" && this.state.inputContents[index].term === "") {
				inputContents.splice(-1);
			} else {
				inputContents[index].definition = input;
			}
		}

		this.setState({
			inputContents: inputContents,
		}, () => this.handleSetDataChange(vocabIndex));
	}

	onSetTitleInputChange = (event) => {
		this.setState({
			inputs: {
				...this.state.inputs,
				title: event.target.value,
			}
		}, () => this.handleSetDataChange());
	}

	onPublicSetInputChange = (event) => {
		if (this.state.canMakeSetNonPublic) this.setState({
			inputs: {
				...this.state.inputs,
				public: event.target.checked,
			}
		});
	}

	getVocabDocRef = (vocabCollectionRef, contents) => {
		if (this.props.createSet === true) {
			return vocabCollectionRef.doc();
		} else {
			return vocabCollectionRef.doc(contents.vocabId);
		}
	}

	saveSet = async () => {
		if (this.state.canSaveSet) {
			const noChangesMade = !this.state.changesMade;

			this.setState({
				loading: true,
				canSaveSet: false,
				changesMade: false,
			});

			if (noChangesMade) {
				this.props.history.push("/sets/" + this.props.match.params.setId);
			} else {
				const db = this.state.db;
				const setCollectionRef = db.collection("sets");
				let vocabCollectionRef;
				let setId;
				if (this.props.createSet === true) {
					let setDocRef = setCollectionRef.doc();
					await setDocRef.set({
						title: this.state.inputs.title,
						public: this.state.inputs.public,
						owner: this.state.user.uid,
						groups: [],
					});
					setId = setDocRef.id;
					vocabCollectionRef = setDocRef.collection("vocab");
				} else {
					vocabCollectionRef = setCollectionRef.doc(this.props.match.params.setId).collection("vocab");
					setId = this.props.match.params.setId;
				}
		
				let promises = [];
				let batches = [db.batch()];

				this.state.inputContents.map((contents, index) => {
					if (index % 248 === 0) {
						promises.push(batches[batches.length - 1].commit());
						batches.push(db.batch());
					}

					if (this.props.createSet !== true
						&& this.cleanseVocabString(contents.term) === "") {
							let vocabDocRef = this.getVocabDocRef(vocabCollectionRef, contents);
							return batches[batches.length - 1].delete(vocabDocRef);
					} else if (this.props.createSet === true || JSON.stringify(contents) !== JSON.stringify(this.state.originalInputContents[index])) {
						let vocabDocRef = this.getVocabDocRef(vocabCollectionRef, contents);
						return batches[batches.length - 1].set(vocabDocRef, {
							term: contents.term,
							definition: contents.definition,
							sound: contents.sound,
						});
					}

					return true;
				});
				
				if (!batches[batches.length - 1]._delegate._committed) promises.push(batches[batches.length - 1].commit().catch(() => null));

				Promise.all(promises).then(() => {
					this.stopLoading();
					this.props.history.push("/sets/" + setId);
				}).catch((error) => {
					console.log("Couldn't update set: " + error);
					this.stopLoading(true);
				});
			}
		}
	}

	render() {
		return (
			this.state.setInaccessible
			?
			<Error404 />
			:
			<div>
				<Prompt
					when={this.state.changesMade}
					message="Are you sure you want to leave? You will lose any unsaved changes."
				/>

				<NavBar items={this.state.navbarItems} />

				<main>
					<div className="page-header">
						<h2>
							<input
								type="text"
								name="set_title"
								onChange={this.onSetTitleInputChange}
								placeholder="Set Title"
								value={this.state.inputs.title}
								className="set-title-input"
								autoComplete="off"
								ref={inputEl => (this.setNameInput = inputEl)}
							/>
						</h2>
						<Button
							onClick={this.saveSet}
							loading={this.state.loading}
							disabled={!this.state.canSaveSet}
						>
							Save
						</Button>
					</div>

					<div className="form create-set-vocab-list">
						<label>
							<Checkbox
								checked={this.state.inputs.public}
								onChange={this.onPublicSetInputChange}
								inputProps={{ 'aria-label': 'checkbox' }}
							/>
							<span>Public</span>
						</label>

						<div className="create-set-header">
							<h3>Terms</h3>
							<h3>Definitions</h3>
						</div>

						{this.state.inputContents.concat({ term: "", definition: "" }).map((contents, index) =>
							<div className="create-set-input-row" key={index}>
								<input
									type="text"
									name={`term_${index}`}
									onChange={event => this.onTermInputChange(event, index)}
									value={contents.term}
									autoComplete="off"
									autoCapitalize="none"
									autoCorrect="off"
								/>
								<input
									type="text"
									name={`definition_${index}`}
									onChange={event => this.onDefinitionInputChange(event, index)}
									value={contents.definition}
									autoComplete="off"
									autoCapitalize="none"
									autoCorrect="off"
								/>
							</div>
						)}
					</div>
				</main>
			<Footer />
			</div>
		)
	}
})
