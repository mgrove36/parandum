import React from 'react';
import NavBar from "./NavBar";
import { Link } from "react-router-dom";
import { ExitToAppRounded as ExitToAppRoundedIcon, HistoryRounded as HistoryRoundedIcon, SettingsRounded as SettingsRoundedIcon, PersonRounded as PersonRoundedIcon, PublicRounded as PublicRoundedIcon, GroupRounded as GroupRoundedIcon, AddRounded as AddRoundedIcon, SwapHorizRounded as SwapHorizRoundedIcon, PeopleRounded as PeopleRoundedIcon, DeleteRounded as DeleteRoundedIcon, QuestionAnswerRounded as QuestionAnswerRoundedIcon } from "@material-ui/icons";
import Checkbox from '@material-ui/core/Checkbox';

import Xarrow from 'react-xarrows';

import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";
import Button from './Button';
import LinkButton from './LinkButton';
import Footer from "./Footer";
import "./css/Form.css";
import "./css/History.css";
import "./css/LoggedInHome.css";

import { withRouter } from "react-router-dom";

export default withRouter(class LoggedInHome extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			functions: {
				createProgress: props.functions.httpsCallable("createProgress"),
			},
			canStartTest: false,
			loading: false,
			selections: {},
			navbarItems: [
				{
					type: "link",
					name: "History",
					link: "/history",
					icon: <HistoryRoundedIcon />,
					hideTextMobile: true,
				},
				{
					type: "link",
					name: "Settings",
					link: "/settings",
					icon: <SettingsRoundedIcon />,
					hideTextMobile: true,
				},
				{
					type: "button",
					name: "Logout",
					onClick: () => this.state.firebase.auth().signOut(),
					icon: <ExitToAppRoundedIcon />,
					hideTextMobile: true,
				}
			],
			progressHistoryIncomplete: [],
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
		document.title = "Parandum";
		
		const userSetsRef = this.state.db.collection("sets")
			.where("owner", "==", this.state.user.uid)
			.orderBy("title");
		const publicSetsRef = this.state.db.collection("sets")
			.where("public", "==", true)
			.where("owner", "!=", this.state.user.uid)
			.orderBy("owner")
			.orderBy("title");
		const userGroupsRef = this.state.db.collection("users")
			.doc(this.state.user.uid)
			.collection("groups");
		const userGroupSetsRef = this.state.db.collection("sets");
		const groupRef = this.state.db.collection("groups");
		const progressRef = this.state.db.collection("progress")
			.where("uid", "==", this.state.user.uid)
			.where("duration", "==", null)
			.orderBy("start_time", "desc")

		let newState = this.state;

		const userSetsQuery = userSetsRef.get().then((userSetsQuerySnapshot) => {
			newState.userSets = userSetsQuerySnapshot.docs;

			userSetsQuerySnapshot.docs.map((doc) => newState.selections[doc.id] = false);

		});
		const publicSetsQuery = publicSetsRef.get().then((publicSetsQuerySnapshot) => {
			newState.publicSets = publicSetsQuerySnapshot.docs;

			publicSetsQuerySnapshot.docs.map((doc) => newState.selections[doc.id] = false);

		});
		const userGroupsQuery = userGroupsRef.get().then(async (userGroupsQuerySnapshot) => {
			newState.user.groups = [];
			var userGroupSets = [];

			return Promise.all(userGroupsQuerySnapshot.docs.map((group) => {
				newState.user.groups.push(group.id);

				const groupData = groupRef.doc(group.id).get();

				return userGroupSetsRef
					.where("public", "==", true)
					.where("groups", "array-contains", group.id)
					.get().then(async (userGroupSetsQuerySnapshot) => {
						groupData.then((result) => {
							if (typeof result !== "undefined" && typeof result.data === "function" && userGroupSetsQuerySnapshot.docs.length > 0) {
								userGroupSets.push({
									group: result,
									sets: userGroupSetsQuerySnapshot.docs,
								});
								
								userGroupSetsQuerySnapshot.docs.map((doc) => newState.selections[doc.id] = false);
							}
						});
					});
			})).then(() => {
				newState.userGroupSets = userGroupSets.sort((a,b) => {
					if (a.group.data().display_name < b.group.data().display_name) {
						return -1;
					}
					if (a.group.data().display_name > b.group.data().display_name) {
						return 1;
					}
					return 0;
				})
			});
		});
		const progressQuery = progressRef.get().then((progressQuerySnapshot) => {
			progressQuerySnapshot.docs.map((doc) => {
				const data = doc.data();
				return newState.progressHistoryIncomplete.push({
					id: doc.id,
					setTitle: data.set_title,
					switchLanguage: data.switch_language,
					progress: (data.progress / data.questions.length * 100).toFixed(2),
					mark: (data.progress > 0 ? data.correct.length / data.progress * 100 : 0).toFixed(2),
					mode: data.mode,
				});
			})
		})

		Promise.all([
			userSetsQuery,
			publicSetsQuery,
			userGroupsQuery,
			progressQuery
		]).then(() => {
			this.setState(newState);
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
			const selections = Object.keys(this.state.selections)
				.filter(x => this.state.selections[x]);
			this.state.functions.createProgress({
				sets: selections,
				switch_language: false,
				mode: "questions",
				limit: 10,
			}).then((result) => {
				const progressId = result.data;
				this.stopLoading();
				this.props.history.push("/progress/" + progressId);
			}).catch((error) => {
				console.log(`Couldn't start test: ${error}`);
				this.stopLoading();
			});
	
			this.setState({
				canStartTest: false,
				loading: true,
			});
		}
	}

	handleSetSelectionChange = (event) => {
		let newState = { ...this.state };
		newState.selections[event.target.name] = event.target.checked;
		this.setState(newState);
		if (Object.values(this.state.selections).indexOf(true) > -1) {
			this.setState({ canStartTest: true });
		} else {
			this.setState({ canStartTest: false });
		}
	}

	deleteProgress = (progressId) => {
		this.state.db.collection("progress")
			.doc(progressId)
			.delete()
			.then(() => {
				const progressIndex = this.state.progressHistoryIncomplete.map((obj) => obj.id).indexOf(progressId);
				let newState = {
					progressHistoryIncomplete: this.state.progressHistoryIncomplete,
				};
				newState.progressHistoryIncomplete.splice(progressIndex);
				this.setState(newState);
			});
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />
				
				<main>
					<div className="page-header page-header--home">
						<h1>Study</h1>
						<div className="button-container buttons--desktop">
							<Button
								onClick={this.startTest}
								loading={this.state.loading}
								disabled={!this.state.canStartTest}
							>
								Test ({Object.values(this.state.selections).filter(x => x === true).length})
							</Button>
							<LinkButton
								to="/groups"
							>
								Groups
							</LinkButton>
							{
								this.state.userSets && this.state.userSets.length > 0 &&
								<LinkButton
									to="/my-sets"
								>
									My Sets
								</LinkButton>
							}
							<LinkButton id="create-set-button-desktop" to="/create-set" icon={<AddRoundedIcon/>} className="button--round"></LinkButton>
						</div>
						<LinkButton id="create-set-button-mobile" to="/create-set" icon={<AddRoundedIcon />} className="button--round buttons--mobile"></LinkButton>
					</div>
					{
						this.state.progressHistoryIncomplete.length > 0 &&
						<>
							<h2>Incomplete Tests</h2>
							<div className="progress-history-container">
								<div>
									<h3>Set</h3>
									<h3>Progress</h3>
									<h3>Mark</h3>
									<h3>Mode</h3>
								</div>
								{
									this.state.progressHistoryIncomplete.map((progressItem) =>
										<div key={progressItem.id}>
											<Link
												to={`/progress/${progressItem.id}`}
											>
												{progressItem.setTitle}
												{
													progressItem.switchLanguage &&
													<SwapHorizRoundedIcon />
												}
											</Link>
											<p>{progressItem.progress}%</p>
											<p>{progressItem.mark}%</p>
											<p>
												{
													progressItem.mode === "questions"
														?
														<QuestionAnswerRoundedIcon />
														:
														<PeopleRoundedIcon />
												}
											</p>
											<Button
												className="button--no-background"
												onClick={() => this.deleteProgress(progressItem.id)}
												icon={<DeleteRoundedIcon />}
											></Button>
										</div>
									)
								}
							</div>
						</>
					}
					<div className="page-header page-header--left buttons--mobile">
						<Button
							onClick={this.startTest}
							loading={this.state.loading}
							disabled={!this.state.canStartTest}
							>
							Test ({Object.values(this.state.selections).filter(x => x === true).length})
						</Button>
						<LinkButton
							to="/groups"
							>
							Groups
						</LinkButton>
						{
							this.state.userSets && this.state.userSets.length > 0 &&
							<LinkButton
								to="/my-sets"
							>
								My Sets
							</LinkButton>
						}
					</div>
					<p id="page-intro" className="page-intro">
						{
							this.state.userSets && this.state.userSets.length > 0
							?
							"Choose sets to study"
							:
							"Create a set to start studying!"
						}
					</p>
					{
						(this.state.userSets && this.state.userSets.length === 0) && (this.state.userGroupSets && this.state.userGroupSets.length === 0) && this.state.progressHistoryIncomplete.length === 0 &&
						<>
							<Xarrow
								start="page-intro"
								end="create-set-button-mobile"
								curveness={0.5}
								color="white"
								divContainerProps={{ className: "buttons--mobile" }}
							/>
						</>
					}
					<div className="form set-list">
						{this.state.userSets && this.state.userSets.length > 0 &&
							<div className="checkbox-list-container">
								<h3><PersonRoundedIcon /> Personal Sets</h3>
								<div className="checkbox-list">
									{this.state.userSets
										.sort((a, b) => {
											if (a.data().title < b.data().title) {
												return -1;
											}
											if (a.data().title > b.data().title) {
												return 1;
											}
											return 0;
										})
										.map(set =>
											<div key={set.id}>
												<label>
													<Checkbox
														name={set.id}
														checked={this.state.selections[set.id]}
														onChange={this.handleSetSelectionChange}
														inputProps={{ 'aria-label': 'checkbox' }}
													/>
													<Link to={`/sets/${set.id}`}>
														{set.data().title}
													</Link>
												</label>
											</div>
									)}
								</div>
							</div>
						}
						{this.state.userGroupSets && this.state.userGroupSets.length > 0 && this.state.userGroupSets.map(data =>
							data.sets && data.sets.length > 0 &&
								<div key={data.group.id} className="checkbox-list-container">
									<Link to={`/groups/${data.group.id}`}>
										<h3><GroupRoundedIcon /> {data.group.data().display_name}</h3>
									</Link>

									<div className="checkbox-list">
										{data.sets.map(set =>
											<div key={set.id}>
												<label>
													<Checkbox
														name={set.id}
														checked={this.state.selections[set.id]}
														onChange={this.handleSetSelectionChange}
														inputProps={{ 'aria-label': 'checkbox' }}
													/>
													<Link to={`/sets/${set.id}`}>
														{set.data().title}
													</Link>
												</label>
											</div>
										)}
									</div>
								</div>
						)}
						{this.state.publicSets && this.state.publicSets.length > 0 &&
							<div className="checkbox-list-container">
								<h3><PublicRoundedIcon /> Public Sets</h3>
								<div className="checkbox-list">
									{this.state.publicSets.map(set =>
										<div key={set.id}>
											<label>
												<Checkbox
													name={set.id}
													checked={this.state.selections[set.id]}
													onChange={this.handleSetSelectionChange}
													inputProps={{ 'aria-label': 'checkbox' }}
												/>
												<Link to={`/sets/${set.id}`}>
													{set.data().title}
												</Link>
											</label>
										</div>
									)}
								</div>
							</div>
						}
					</div>
				</main>
				<Footer />
			</div>
		)
	}
})