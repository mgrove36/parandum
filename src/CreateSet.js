import React from 'react';
import { withRouter } from 'react-router-dom';
import NavBar from "./NavBar";
import Button from "./Button";
import Footer from "./Footer";
import { HomeRounded as HomeRoundedIcon, CheckCircleOutlineRounded as CheckCircleOutlineRoundedIcon } from "@material-ui/icons";
import Checkbox from '@material-ui/core/Checkbox';

// import { doc, collection, setDoc, writeBatch } from "firebase/firestore";

import "./css/Form.css";

export default withRouter(class CreateSet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			loading: false,
			canCreateSet: false,
			inputContents: [],
			inputs: {
				title: "",
				public: false,
			},
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
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

	componentDidMount() {
		document.title = "Create Set | Parandum";
		this.setNameInput.focus();

		this.props.logEvent("page_view");
	}

	componentWillUnmount() {
		this.isMounted = false;
	}

	stopLoading = () => {
		this.setState({
			canCreateSet: true,
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
				canCreateSet: true,
			})
		} else {
			this.setState({
				canCreateSet: false,
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
		this.setState({
			inputs: {
				...this.state.inputs,
				public: event.target.checked,
			}
		});
	}

	createSet = () => {
		if (this.state.canCreateSet) {
			this.setState({
				loading: true,
				canCreateSet: false,
			});
	
			const db = this.state.db;
			const setDocRef = db.collection("sets").doc();
			// const setDocRef = doc(collection(this.state.db, "sets"));
			
			setDocRef.set({
				title: this.state.inputs.title,
				public: this.state.inputs.public,
				owner: this.state.user.uid,
				groups: [],
			})
			// setDoc(setDocRef, {
			// 	title: this.state.inputs.title,
			// 	public: this.state.inputs.public,
			// 	owner: this.state.user.uid,
			// 	groups: [],
			// })
			.then(() => {
				const batch = db.batch();
				// const batch = writeBatch(this.state.db);
				
				this.state.inputContents.map((contents) => {
					const vocabDocRef = setDocRef.collection("vocab").doc();
					// const vocabDocRef = doc(collection(setDocRef, "vocab"));
					return batch.set(vocabDocRef, {
						term: contents.term,
						definition: contents.definition,
						sound: false,
					})
				})
		
				// TODO: sound files
		
				batch.commit().then(() => {
					this.stopLoading();
					this.props.history.push("/sets/" + setDocRef.id);
				}).catch((e) => {
					console.log("Couldn't create set. Batch commit error: " + e);
					this.stopLoading();
				})
			});
		}
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />

				<main>
					<h2 className="page-header">
						<input
							type="text"
							name="set_title"
							onChange={this.onSetTitleInputChange}
							placeholder="Set Title"
							className="set-title-input"
							ref={inputEl => (this.setNameInput = inputEl)}
						/>
					</h2>

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

						{this.state.inputContents.concat({term: "", definition: ""}).map((contents, index) => 
							<div className="create-set-input-row" key={index}>
								<input
									type="text"
									name={`term_${index}`}
									onChange={this.onTermInputChange}
								/>
								<input
									type="text"
									name={`definition_${index}`}
									onChange={this.onDefinitionInputChange}
								/>
							</div>
						)}
					</div>
					<Button
						onClick={this.createSet}
						icon={<CheckCircleOutlineRoundedIcon />}
						loading={this.state.loading}
						disabled={!this.state.canCreateSet}
					>
						Create
					</Button>
				</main>
				<Footer />
			</div>
		)
	}
})