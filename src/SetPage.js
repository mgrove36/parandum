import React from 'react';
import { withRouter } from "react-router-dom";
import { HomeRounded as HomeRoundedIcon, PlayArrowRounded as PlayArrowRoundedIcon, EditRounded as EditRoundedIcon, CloudQueueRounded as CloudQueueRoundedIcon, GroupAddRounded as GroupAddRoundedIcon, CloseRounded as CloseRoundedIcon, DeleteRounded as DeleteRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import LinkButton from "./LinkButton";
import Error404 from "./Error404";
import Footer from "./Footer";

import "./css/PopUp.css";
import "./css/SetPage.css";
import "./css/ConfirmationDialog.css";

export default withRouter(class SetPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			functions: {
				createProgress: props.functions.httpsCallable("createProgress"),
				addSetToGroup: props.functions.httpsCallable("addSetToGroup"),
			},
			loading: false,
			canStartTest: true,
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			set: {
				title: "",
				public: false,
				vocab: [],
			},
			setInaccessible: false,
			showAddSetToGroup: false,
			canAddSetToGroup: true,
			addSetToGroupLoading: {},
			groups: {},
			currentSetGroups: [],
			showDeleteConfirmation: false,
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
		const setId = this.props.match.params.setId;
		const setRef = this.state.db
			.collection("sets")
			.doc(setId);
		const setVocabRef = setRef
			.collection("vocab")
			.orderBy("term");

		setRef.get().then((setDoc) => {
			document.title = `${setDoc.data().title} | Parandum`;

			setVocabRef.get().then((querySnapshot) => {
				let vocab = [];
				querySnapshot.docs.map((doc) => {
					const data = doc.data();
					return vocab.push({
						term: data.term,
						definition: data.definition,
						sound: data.sound,
					});
				});
				this.setState({
					set: {
						...this.state.set,
						title: setDoc.data().title,
						public: setDoc.data().public,
						vocab: vocab,
						owner: setDoc.data().owner,
					},
					currentSetGroups: setDoc.data().groups,
				});
			});
		}).catch((error) => {
			this.setState({
				setInaccessible: true,
			});
			console.log(`Can't access set: ${error}`);
		});

		this.props.logEvent("select_content", {
			content_type: "set",
			item_id: this.props.match.params.setId,
		});
	}

	componentWillUnmount() {
		this.isMounted = false;
	}

	stopLoading = () => {
		this.setState({
			canStartTest: true,
			loading: false,
		});
	}
	
	startTest = () => {
		if (this.state.canStartTest) {
			this.state.functions.createProgress({
				sets: [this.props.match.params.setId],
				switch_language: false,
				mode: "questions",
				limit: 1000,
			}).then((result) => {
				const progressId = result.data;
				this.stopLoading();
				this.props.history.push("/progress/" + progressId);

				this.props.logEvent("start_test", {
					progress_id: progressId,
				});
			}).catch((error) => {
				console.log(`Couldn't start test: ${error}`);
				this.stopLoading();
			});
	
			this.setState({
				canStartTest: false,
				loading: true,
			});
		}
	};

	showAddSetToGroup = async () => {
		let newState = {
			showAddSetToGroup: true,
			groups: {},
			addSetToGroupLoading: {},
		};
		await this.state.db.collection("users")
			.doc(this.state.user.uid)
			.collection("groups")
			.where("role", "!=", "member")
			.get()
			.then((querySnapshot) => {
				return Promise.all(querySnapshot.docs.map((userGroupDoc) => {
					if (!this.state.currentSetGroups.includes(userGroupDoc.id))
						return this.state.db.collection("groups")
							.doc(userGroupDoc.id)
							.get()
							.then((groupDoc) => {
								newState.groups[userGroupDoc.id] = groupDoc.data().display_name;
								newState.addSetToGroupLoading[userGroupDoc.id] = false;
							});
					return true;
				}));
			})
		this.setState(newState);
	}

	hideAddSetToGroup = () => {
		this.setState({
			showAddSetToGroup: false,
		});
	}

	stopAddSetToGroupLoading = (groupId, addedSetToGroup = false) => {
		let newState = {
			addSetToGroupLoading: {
				...this.state.addSetToGroupLoading,
				[groupId]: false,
			},
			canAddSetToGroup: true,
			showAddSetToGroup: false,
		};
		if (addedSetToGroup) newState.currentSetGroups = this.state.currentSetGroups.concat(groupId);
		this.setState(newState);
	}

	addSetToGroup = (groupId) => {
		if (this.state.canAddSetToGroup) {
			this.setState({
				addSetToGroupLoading: {
					...this.state.addSetToGroupLoading,
					[groupId]: true,
				},
				canAddSetToGroup: false,
			});
	
			this.state.functions.addSetToGroup({
				groupId: groupId,
				setId: this.props.match.params.setId,
			}).then((result) => {
				this.stopAddSetToGroupLoading(groupId, true);
			}).catch((error) => {
				console.log(`Couldn't add set to group: ${error}`);
			});
		}
	}

	showDeleteSet = () => {
		this.setState({
			showDeleteConfirmation: true,
		});
	}

	hideDeleteConfirmation = () => {
		this.setState({
			showDeleteConfirmation: false,
		});
	}

	deleteSet = () => {
		this.state.db.collection("sets")
			.doc(this.props.match.params.setId)
			.delete()
			.then(() => {
				this.props.history.push("/");
			}).catch((error) => {
				console.log(`Couldn't delete set: ${error}`);
				this.setState({
					showDeleteConfirmation: false,
				})
			});
	}

	render() {
		return (
			<div>
				{
					this.state.setInaccessible
					?
					<Error404 />
					:
					<>
						<NavBar items={this.state.navbarItems} />

						<main>
							<div className="page-header">
								<h1>
									{this.state.set.title}
									{
										this.state.set.public
										?
										<span className="set-cloud-icon"><CloudQueueRoundedIcon /></span>
										:
										""
									}
								</h1>
								<div className="button-container">	
									<Button
										loading={this.state.loading}
										onClick={() => this.startTest()}
										icon={<PlayArrowRoundedIcon />}
											disabled={!this.state.canStartTest}
											className="button--round"
									></Button>
									<Button
										onClick={() => this.showAddSetToGroup()}
										icon={<GroupAddRoundedIcon />}
											className="button--round"
									></Button>
									{
										this.state.set.owner === this.state.user.uid &&
										<LinkButton
											to={`/sets/${this.props.match.params.setId}/edit`}
											icon={<EditRoundedIcon />}
											className="button--round"
										></LinkButton>
									}
									{
										this.state.set.owner === this.state.user.uid && this.state.currentSetGroups.length === 0 &&
										<Button
											onClick={() => this.showDeleteSet()}
											icon={<DeleteRoundedIcon />}
											className="button--round"
										></Button>
									}
								</div>
							</div>

							<div className="vocab-list">
								<div className="vocab-list-header">
									<h3>Terms</h3>
									<h3>Definitions</h3>
								</div>

								{this.state.set.vocab.map((contents, index) =>
									<div className="vocab-row" key={index}>
										<span>{contents.term}</span>
										<span>{contents.definition}</span>
									</div>
								)}
							</div>
						</main>
						<Footer />
						
						{
							this.state.showAddSetToGroup
							?
							<>
								<div className="overlay" onClick={this.hideAddSetToGroup}></div>
								<div className="overlay-content set-page-group-overlay-content">
									{
										Object.keys(this.state.groups).length < 1
										?
										<>
											<h1>No Groups Found</h1>
											<span>This could be because:</span>
											<ul className="no-groups-message-list">
												<li>you're not a member of any groups</li>
												<li>this set is already a part of your groups</li>
												<li>you don't have the required permissions</li>
											</ul>
											<p>To add sets to a group, you must be an owner or collaborator.</p>
										</>
										:
										<>
											<h1>Select a Group</h1>

											<div className="set-page-overlay-group-container">
												{
													Object.keys(this.state.groups).map((groupId) =>
														<Button
															onClick={() => this.addSetToGroup(groupId)}
															className="button--no-background"
															loading={this.state.addSetToGroupLoading[groupId]}
															disabled={!this.state.canAddSetToGroup}
															key={groupId}
														>{this.state.groups[groupId]}</Button>
													)
												}
											</div>
										</>
									}

									<Button
										onClick={this.hideAddSetToGroup}
										icon={<CloseRoundedIcon />}
										className="button--no-background popup-close-button"
									></Button>
								</div>
							</>
							:
							this.state.showDeleteConfirmation &&
							<>
								<div className="overlay" onClick={this.hideDeleteConfirmation}></div>
								<div className="overlay-content confirmation-dialog">
									<h3>Are you sure you want to delete this set?</h3>
									<div className="button-container">	
										<Button
											onClick={this.hideDeleteConfirmation}
										>
											No
										</Button>
										<Button
											onClick={this.deleteSet}
										>
											Yes
										</Button>
									</div>
								</div>
							</>
						}
					</>
				}
			</div>
		)
	}
})
