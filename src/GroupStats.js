import React, { Component } from 'react';
import { ArrowDropDownRounded as ArrowDropDownRoundedIcon, GroupRounded as GroupRoundedIcon, HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import { withRouter } from 'react-router-dom';
import NavBar from "./NavBar";
import Footer from "./Footer";
import Error404 from "./Error404";
import "./css/History.css";
import "./css/MistakesHistory.css";

import Collapsible from "react-collapsible";

export default withRouter(class GroupStats extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			navbarItems: [
				{
					type: "link",
					link: `/groups/${this.props.match.params.groupId}`,
					icon: <GroupRoundedIcon />,
					hideTextMobile: true,
				},
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			role: null,
			groupName: "",
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

	async componentDidMount() {
		let promises = [];
		let newState = {};

		await this.state.db
			.collection("users")
			.doc(this.state.user.uid)
			.collection("groups")
			.doc(this.props.match.params.groupId)
			.get()
			.then((userGroupDoc) => {
				newState.role = userGroupDoc.data().role;
			})
			.catch((error) => {
				console.log(`Can't access user group: ${error}`);
				newState.role = "none";
			});

		if (newState.role === "owner") {
			promises.push(
				this.state.db
					.collection("groups")
					.doc(this.props.match.params.groupId)
					.get()
					.then(async (groupDoc) => {
						// await Promise.all(groupDoc.data().sets.map((setId) => {
						// 	return this.state.db.collection("sets")
						// 		.doc(setId)
						// 		.get()
						// 		.then((doc) => {
						// 			newState.sets[setId] = {
						// 				displayName: doc.data().title,
						// 				loading: false,
						// 			};
						// 		});
						// }));

						document.title = `Stats | ${groupDoc.data().display_name} | Parandum`;
						newState.groupName = groupDoc.data().display_name;
					}).catch((error) => {
						console.log(`Can't access group: ${error}`);
						newState.groupName = "";
						document.title = "Stats | Parandum";
					})
			);

			promises.push(
				this.state.db.collection("incorrect_answers")
					.where("groups", "array-contains", this.props.match.params.groupId)
					.orderBy("term", "asc")
					.get()
					.then((querySnapshot) => {
						let incorrectAnswers = [];
						querySnapshot.docs.map((doc, index, array) => {
							if (index === 0 || doc.data().term !== array[index - 1].data().term || doc.data().definition !== array[index - 1].data().definition) {
								incorrectAnswers.push({
									term: doc.data().term,
									definition: doc.data().definition,
									answers: [{
										answer: doc.data().answer,
										switchLanguage: doc.data().switch_language,
									}],
									count: doc.data().switch_language ? 0 : 1,
									switchedCount: doc.data().switch_language ? 1 : 0,
								});
							} else {
								incorrectAnswers[incorrectAnswers.length - 1].answers.push({
									answer: doc.data().answer,
									switchLanguage: doc.data().switch_language,
								});
								if (doc.data().switch_language) {
									incorrectAnswers[incorrectAnswers.length - 1].switchedCount++;
								} else {
									incorrectAnswers[incorrectAnswers.length - 1].count++;
								}
							}
							return true;
						});
						newState.incorrectAnswers = incorrectAnswers.sort((a, b) => b.count + b.switchedCount - a.count - a.switchedCount);
						newState.totalIncorrect = querySnapshot.docs.length;
					})
					.catch((error) => {
						newState.incorrectAnswers = [];
						newState.totalIncorrect = 0;
						console.log(`Couldn't get group progress: ${error}`);
					})
			)

			await Promise.all(promises);
		}

		this.setState(newState);
		this.props.page.load();

		this.props.logEvent("select_content", {
			content_type: "group_stats",
			item_id: this.props.match.params.groupId,
		});
	}

	componentWillUnmount() {
		this.isMounted = false;
		this.props.page.unload();
	}

	render() {
		return (
			this.state.role !== null ?
			(this.state.role === "owner"
			?
			<div>
				<NavBar items={this.state.navbarItems} />
				<main>
					<h1>Group Stats: {this.state.groupName}</h1>
					<div className="history-sections">
						<div className="historical-user-stats-container">
							<div className="stat-row stat-row--inline">
								<h1>{this.state.totalIncorrect}</h1>
								<p>mistakes</p>
							</div>
							{
								this.state.incorrectAnswers.length > 0 &&
								<div className="stat-row stat-row--inline">
									<h1>{this.state.incorrectAnswers[0].term}</h1>
									<p>meaning</p>
									<h1>{this.state.incorrectAnswers[0].definition}</h1>
									<p>is the most common</p>
								</div>
							}
						</div>
						<div className="mistakes-history-container">
							{
								this.state.incorrectAnswers.map((vocabItem, index) => (
									<React.Fragment key={index}>
										<div>
											<h2>{vocabItem.term}</h2>
											{
												vocabItem.switchedCount > 0
												?
												<Collapsible transitionTime={300} trigger={<><b>{vocabItem.switchedCount} mistake{vocabItem.switchedCount !== 1 && "s"}</b><ArrowDropDownRoundedIcon /></>}>
													{
														vocabItem.switchedCount > 0 &&
														<div>
															{
																vocabItem.answers.sort((a, b) => {
																	if (a.answer < b.answer) {
																		return -1;
																	}
																	if (a.answer > b.answer) {
																		return 1;
																	}
																	return 0;
																}).map((answerItem, index) => answerItem.switchLanguage && (
																	<p key={index}>{answerItem.answer === "" ? <i>skipped</i> : answerItem.answer}</p>
																))
															}
														</div>
													}
												</Collapsible>
												:
												<b>{vocabItem.switchedCount} mistake{vocabItem.switchedCount !== 1 && "s"}</b>
											}
										</div>
										<div>
											<h2>{vocabItem.definition}</h2>
											{
												vocabItem.count > 0
												?
												<Collapsible transitionTime={300} trigger={<><b>{vocabItem.count} mistake{vocabItem.count !== 1 && "s"}</b><ArrowDropDownRoundedIcon /></>}>
													{
														vocabItem.count > 0 &&
														<div>
															{
																vocabItem.answers.sort((a, b) => {
																	if (a.answer < b.answer) {
																		return -1;
																	}
																	if (a.answer > b.answer) {
																		return 1;
																	}
																	return 0;
																}).map((answerItem, index) => !answerItem.switchLanguage && (
																	<p key={index}>{answerItem.answer === "" ? <i>skipped</i> : answerItem.answer}</p>
																))
															}
														</div>
													}
												</Collapsible>
												:
												<b>{vocabItem.switchedCount} mistake{vocabItem.switchedCount !== 1 && "s"}</b>
											}
										</div>
									</React.Fragment>
								))
							}
						</div>
					</div>
				</main>
				<Footer />
			</div>
			:
			<Error404 />)
			:
			null
		)
	}
})
