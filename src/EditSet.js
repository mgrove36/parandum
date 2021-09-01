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
			canSaveSet: true,
			inputs: {
				title: "",
				public: false,
			},
			inputContents: [],
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
		if (this.state.canSaveSet) {
			var confirmationMessage = "Are you sure you want to leave? You will lose any unsaved changes.";
	
			(e || window.event).returnValue = confirmationMessage; //Gecko + IE
			return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		}
		return "";
	}

	componentDidMount() {
		window.addEventListener("beforeunload", this.alertLeavingWithoutSaving);

		const setId = this.props.match.params.setId;
		const setRef = this.state.db.collection("sets")
			.doc(setId);
		const setVocabRef = setRef.collection("vocab")
			.orderBy("term");

		setRef.get().then((setDoc) => {
			document.title = `Edit | ${setDoc.data().title} | Parandum`;

			setVocabRef.get().then((querySnapshot) => {
				let vocab = [];
				let vocabPairsCount = 0;

				querySnapshot.docs.map((doc) => {
					const data = doc.data();

					if (this.cleanseVocabString(data.term) !== "" &&
						this.cleanseVocabString(data.definition) !== "") {
						vocabPairsCount++;
					}

					return vocab.push({
						vocabId: doc.id,
						term: data.term,
						definition: data.definition,
						sound: data.sound,
					});
				});

				let newState = {
					inputs: {
						title: setDoc.data().title,
						public: setDoc.data().public,
					},
					inputContents: vocab,
					canMakeSetNonPublic: !(setDoc.data().groups && setDoc.data().groups.length > 0),
				};

				if (!(newState.inputs.title !== "" && vocabPairsCount > 0 && vocabPairsCount === this.state.inputContents.length)) {
					newState.canSaveSet = false;
				}
				
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
	}

	componentWillUnmount = () => {
		window.removeEventListener('beforeunload', this.alertLeavingWithoutSaving);
		this.isMounted = false;
	}

	stopLoading = () => {
		this.setState({
			canStartTest: true,
			loading: false,
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

	handleSetDataChange = () => {
		const numberOfVocabPairs = this.state.inputContents.map(contents =>
			this.cleanseVocabString(contents.term) !== "" &&
			this.cleanseVocabString(contents.definition) !== "")
			.filter(x => x === true)
			.length;

		if (this.state.inputs.title !== "" && numberOfVocabPairs > 0 && numberOfVocabPairs === this.state.inputContents.length) {
			this.setState({
				canSaveSet: true,
			})
		} else {
			this.setState({
				canSaveSet: false,
			})
		}
	}

	onTermInputChange = (event) => {
		const index = Number(event.target.name.replace("term_", ""));
		const input = event.target.value;

		let inputContents = this.state.inputContents;

		if (index >= this.state.inputContents.length && input !== "") {
			inputContents.push({
				term: input,
				definition: "",
				sound: false,
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
		}, this.handleSetDataChange());
	}

	onDefinitionInputChange = (event) => {
		const index = Number(event.target.name.replace("definition_", ""));
		const input = event.target.value;

		let inputContents = this.state.inputContents;

		if (index >= this.state.inputContents.length && input !== "") {
			inputContents.push({
				term: "",
				definition: input,
				sound: false,
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
		}, this.handleSetDataChange());
	}

	onSetTitleInputChange = (event) => {
		this.setState({
			inputs: {
				...this.state.inputs,
				title: event.target.value,
			}
		}, this.handleSetDataChange());
	}

	onPublicSetInputChange = (event) => {
		if (this.state.canMakeSetNonPublic) this.setState({
			inputs: {
				...this.state.inputs,
				public: event.target.checked,
			}
		}, this.handleSetDataChange());
	}

	saveSet = () => {
		if (this.state.canSaveSet) {
			this.setState({
				loading: true,
				canSaveSet: false,
			});
	
			const db = this.state.db;
			const setId = this.props.match.params.setId;
			const setDocRef = db.collection("sets").doc(setId);
	
			setDocRef.update({
				title: this.state.inputs.title,
				public: this.state.inputs.public,
			}).then(() => {
				const batch = db.batch();
	
				this.state.inputContents.map((contents) => {
					const vocabDocRef = setDocRef.collection("vocab").doc(contents.vocabId);
					return batch.set(vocabDocRef, {
						term: contents.term,
						definition: contents.definition,
						sound: contents.sound,
					})
				})
	
				// TODO: sound files
	
				batch.commit().then(() => {
					this.stopLoading();
					this.props.history.push("/sets/" + setDocRef.id);
				}).catch((e) => {
					console.log("Couldn't update set. Batch commit error: " + e);
					this.stopLoading();
				})
			});
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
					when={this.state.canSaveSet}
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
									onChange={this.onTermInputChange}
									value={this.state.inputContents[index] ? this.state.inputContents[index].term : ""}
								/>
								<input
									type="text"
									name={`definition_${index}`}
									onChange={this.onDefinitionInputChange}
									value={this.state.inputContents[index] ? this.state.inputContents[index].definition : ""}
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
