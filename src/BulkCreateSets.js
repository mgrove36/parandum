import React, { Component } from 'react';
import { withRouter, Prompt } from "react-router-dom";
import { HomeRounded as HomeRoundedIcon, UndoRounded as TuneRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import Footer from "./Footer";
import LinkButton from "./LinkButton";
import AcceptDialog from "./AcceptDialog";
import Checkbox from '@material-ui/core/Checkbox';

const emptySetData = {
	title: "",
	public: false,
	text: "",
	vocabPairs: [],
	vocabChanged: false,
	incompletePairFound: false,
};

export default withRouter(class BulkCreateSets extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			loading: false,
			canSave: false,
			sets: [
				{
					...emptySetData
				}
			],
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			termDefSeparator: "\\n",
			pairSeparator: "\\n",
			changesMade: false,
			showErrorDialog: false,
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
		if (this.state.changesMade) {
			var confirmationMessage = "Are you sure you want to leave? You will lose any unsaved changes.";
	
			(e || window.event).returnValue = confirmationMessage; //Gecko + IE
			return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		}
		return "";
	}

	async componentDidMount() {
		window.addEventListener("beforeunload", this.alertLeavingWithoutSaving);

		document.title = "Bulk Create Sets | Parandum";
		this.props.logEvent("page_view");

		this.firstSetNameInput.focus();
		this.props.page.load();
	}

	componentWillUnmount = () => {
		window.removeEventListener('beforeunload', this.alertLeavingWithoutSaving);
		this.isMounted = false;
		this.props.page.unload();
	}

	stopLoading = () => {
		this.setState({
			canSave: false,
			loading: false,
		});
	}

	cleanseVocabString = (item, otherPatterns=[]) => {
		let newItem = item;
		otherPatterns.map(pattern => newItem = newItem.replace(new RegExp(pattern, "g"), ""));
		const chars = /[\p{P}\p{S}\n ]+/ug;
		return newItem.replace(chars, "");
	}

	removeNewLines = (item) => item.replace(/[\n]+/ug, "")

	handleSetDataChange = () => {
		const sets = [...this.state.sets];
		if (sets[this.state.sets.length - 1].text !== "" || sets[this.state.sets.length - 1].title !== "") {
			sets.push({...emptySetData});
			this.setState({
				sets,
				changesMade: true,
			});
		} else if (sets[this.state.sets.length - 2].text === "" && sets[this.state.sets.length - 2].title === "") {
			sets.pop();
			this.setState({
				sets,
				changesMade: true,
			});
		}
	}

	checkIfCanSave = async () => {
		let anySetIncomplete = this.state.termDefSeparator === "" || this.state.pairSeparator === "";
		let newSets;
		if (!anySetIncomplete) {
			let sets = [...this.state.sets];
			const pairSeparator = this.state.pairSeparator.replace("\\n","\n");
			const termDefSeparator = this.state.termDefSeparator.replace("\\n","\n");

			const setsWithVocab = sets.slice(0,-1).map(set => {
				let setIncomplete = this.cleanseVocabString(set.title) === "" || this.cleanseVocabString(set.text, [pairSeparator, termDefSeparator]) === "";
				if (setIncomplete) {
					anySetIncomplete = true;
					return {
						...set,
						vocabChanged: false,
						setIncomplete,
					};
				}
				if (set.vocabChanged) {
					let vocabPairs = [];
					if (pairSeparator === termDefSeparator) {
						set.text.trim().split(pairSeparator).forEach((item, index, arr) => {
							if (index % 2 === 0) {
								let definition = "unknown";
								if (index === arr.length - 1 || this.cleanseVocabString(item, [pairSeparator, termDefSeparator]) === "" || this.cleanseVocabString(arr[index + 1], [pairSeparator, termDefSeparator]) === "") {
									anySetIncomplete = setIncomplete = true;
								}
								else {
									definition = arr[index + 1];
								}
								vocabPairs.push({
									term: item,
									definition,
									sound: false,
								});
							};
						});
					} else {
						vocabPairs = set.text.trim().split(pairSeparator)
							.map((pair) => {
								let [first, ...rest] = pair.split(termDefSeparator);
								if (rest.length <= 0 || this.cleanseVocabString(first, [pairSeparator, termDefSeparator]) === "" || this.cleanseVocabString(rest.join(termDefSeparator), [pairSeparator, termDefSeparator]) === "") {
									rest = "unknown";
									anySetIncomplete = setIncomplete = true;
								} else {
									rest = rest.join(termDefSeparator);
								}
								return {
									term: first,
									definition: rest,
									sound: false,
								};
							});
					}

					if (vocabPairs.length < 1) {
						anySetIncomplete = setIncomplete = true;
					}

					return {
						...set,
						vocabPairs,
						vocabChanged: false,
						setIncomplete,
					};
				}
				if (set.setIncomplete) {
					anySetIncomplete = true;
				}
				return set;
			});
			newSets = setsWithVocab.concat(sets[sets.length - 1]);
		} else {
			newSets = [...this.state.sets];
		}

		this.setState({
			sets: newSets,
			canSave: !anySetIncomplete,
			showErrorDialog: anySetIncomplete,
		}, () => {if (!anySetIncomplete) this.saveSets()});
	}

	onTermDefSeparatorInputChange = (event) => {
		this.setState({
			termDefSeparator: event.target.value,
		});
	}

	onPairSeparatorInputChange = (event) => {
		this.setState({
			pairSeparator: event.target.value,
		});
	}

	onSetTitleInputChange = (event, setIndex) => {
		let sets = [...this.state.sets];
		sets[setIndex].title = event.target.value;
		this.setState({
			sets,
		}, () => this.handleSetDataChange());
	}

	onPublicSetInputChange = (event, setIndex) => {
		let sets = [...this.state.sets];
		sets[setIndex].public = event.target.checked;
		this.setState({
			sets,
		});
	}

	onVocabInputChange = (event, setIndex) => {
		let sets = [...this.state.sets];
		sets[setIndex].text = event.target.value;
		sets[setIndex].vocabChanged = true;
		this.setState({
			sets,
		}, () => this.handleSetDataChange());
	}

	saveSets = async () => {
		if (this.state.canSave) {
			this.setState({
				loading: true,
				canSave: false,
			});

			const db = this.state.db;
			const setCollectionRef = db.collection("sets");

			let promises = [];

			this.state.sets.slice(0,-1).map(async (set) => {
				let setDocRef = setCollectionRef.doc();
				setDocRef.set({
					title: set.title,
					public: set.public,
					owner: this.state.user.uid,
					groups: [],
				}).then(() => {
					let vocabCollectionRef = setDocRef.collection("vocab");
			
					let batches = [db.batch()];

					set.vocabPairs.map((vocabPair, index) => {
						if (index % 248 === 0) {
							promises.push(batches[batches.length - 1].commit());
							batches.push(db.batch());
						}

						let vocabDocRef = vocabCollectionRef.doc()
						return batches[batches.length - 1].set(vocabDocRef, {
							term: this.removeNewLines(vocabPair.term),
							definition: this.removeNewLines(vocabPair.definition),
							sound: vocabPair.sound,
						});
					});
					
					if (!batches[batches.length - 1]._delegate._committed) promises.push(batches[batches.length - 1].commit().catch(() => null));
				});
			});

			Promise.all(promises).then(() => {
				this.stopLoading();
				this.props.history.push("/");
			}).catch((error) => {
				console.log("Couldn't create sets: " + error);
				this.stopLoading();
			});
		}
	}

	closeErrorDialog = () => {
		this.setState({
			showErrorDialog: false,
		})
	}

	render() {
		return (
			<div>
				<Prompt
					when={this.state.changesMade}
					message="Are you sure you want to leave? You will lose any unsaved changes."
				/>

				<NavBar items={this.state.navbarItems} />

				<main>
					<div className="page-header">
						<h1>Bulk Create Sets</h1>
						<LinkButton to="/create-set" icon={<TuneRoundedIcon/>}>Normal</LinkButton>
					</div>
					<div className="bulk-create-sets-section bulk-create-sets-header">
						<label>
							<input
								type="text"
								name="term-def-separator"
								onChange={this.onTermDefSeparatorInputChange}
								value={this.state.termDefSeparator}
								autoComplete="off"
								autoCapitalize="none"
								autoCorrect="off"
							/>
							<span>Term/definition separator</span>
						</label>
						<label>
							<input
								type="text"
								name="pair-separator"
								onChange={this.onPairSeparatorInputChange}
								value={this.state.pairSeparator}
								autoComplete="off"
								autoCapitalize="none"
								autoCorrect="off"
							/>
							<span>Pair separator</span>
						</label>
					</div>
					{
						this.state.sets.map((data, setIndex) => 
							<div className="bulk-create-sets-section" key={setIndex}>
								<div className="page-header">
									<h2>
										<input
											type="text"
											name={`set_${setIndex}_title`}
											onChange={(event) => this.onSetTitleInputChange(event, setIndex)}
											placeholder="Set Title"
											value={data.title}
											className="set-title-input"
											autoComplete="off"
											ref={(inputEl) => {if (setIndex === 0) this.firstSetNameInput = inputEl}}
										/>
									</h2>
								</div>
							
								<label>
									<Checkbox
										checked={data.public}
										onChange={(event) => this.onPublicSetInputChange(event, setIndex)}
										inputProps={{ 'aria-label': 'checkbox' }}
									/>
									<span>Public</span>
								</label>

								<div className="form create-set-vocab-list">

									<textarea
										name={`set_${setIndex}_vocab`}
										onChange={(event) => this.onVocabInputChange(event, setIndex)}
										value={data.text}
										autoComplete="off"
										autoCapitalize="none"
										autoCorrect="off"
										className="bulk-create-sets-text"
										placeholder="Vocabulary"
									/>
								</div>
							</div>
						)
					}

					<Button
						onClick={this.checkIfCanSave}
						loading={this.state.loading}
					>
						Save
					</Button>
					{
						this.state.showErrorDialog && <AcceptDialog acceptFunction={this.closeErrorDialog} message="Ensure all fields are filled in correctly"/>
					}
				</main>
			<Footer />
			</div>
		)
	}
})
