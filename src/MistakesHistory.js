import React, { Component } from 'react';
import { ArrowDropDownRounded as ArrowDropDownRoundedIcon, HistoryRounded as HistoryRoundedIcon, HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Footer from "./Footer";
import "./css/History.css";
import "./css/MistakesHistory.css";

import Collapsible from "react-collapsible";

export default class IncorrectHistory extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
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
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			incorrectAnswers: [],
			totalIncorrect: 0,
			totalTests: 0,
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
		document.title = "Incorrect | History | Parandum";

		let promises = [];
		let newState = {};

		promises.push(
			this.state.db.collection("incorrect_answers")
				.where("uid", "==", this.state.user.uid)
				.orderBy("term", "asc")
				.get()
				.then((querySnapshot) => {
					let incorrectAnswers = [];
					querySnapshot.docs.map((doc, index, array) => {
						if (index === 0 || doc.data().term !== array[array.length - 1].data().term || doc.data().definition !== array[array.length - 1].data().definition) {
							incorrectAnswers.push({
								term: doc.data().term,
								definition: doc.data().definition,
								switchedAnswers: {},
								notSwitchedAnswers: {},
								switchedCount: 0,
								notSwitchedCount: 0,
							});
						}

						if (doc.data().switch_language) {
							if (Object.keys(incorrectAnswers[incorrectAnswers.length - 1].switchedAnswers).includes(doc.data().answer)) {
								incorrectAnswers[incorrectAnswers.length - 1].switchedAnswers[doc.data().answer]++;
							} else {
								incorrectAnswers[incorrectAnswers.length - 1].switchedAnswers[doc.data().answer] = 1;
							}
							incorrectAnswers[incorrectAnswers.length - 1].switchedCount++;
						} else {
							if (Object.keys(incorrectAnswers[incorrectAnswers.length - 1].notSwitchedAnswers).includes(doc.data().answer)) {
								incorrectAnswers[incorrectAnswers.length - 1].notSwitchedAnswers[doc.data().answer]++;
							} else {
								incorrectAnswers[incorrectAnswers.length - 1].notSwitchedAnswers[doc.data().answer] = 1;
							}
							incorrectAnswers[incorrectAnswers.length - 1].notSwitchedCount++;
						}
						return true;
					});
					newState.incorrectAnswers = incorrectAnswers.sort((a,b) => b.count + b.switchedCount - a.count - a.switchedCount);
					newState.totalIncorrect = querySnapshot.docs.length;
				})
				.catch((error) => {
					newState.incorrectAnswers = [];
					newState.totalIncorrect = 0;
					console.log(`Couldn't get group progress: ${error}`);
				})
		);

		promises.push(
			this.state.db.collection("progress")
				.where("uid", "==", this.state.user.uid)
				.get()
				.then((querySnapshot) => newState.totalTests = querySnapshot.docs.length)
		);

		await Promise.all(promises);

		this.setState(newState);

		this.props.page.load();

		this.props.logEvent("page_view");
	}

	componentWillUnmount() {
		this.isMounted = false;
		this.props.page.unload();
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />
				<main>
					<h1>Mistakes</h1>

					<div className="history-sections">
						<div className="historical-user-stats-container">
							<div className="stat-row stat-row--inline">
								<h1>{this.state.totalIncorrect}</h1>
								<p>mistakes</p>
							</div>
							{
								this.state.totalTests > 0 &&
								<div className="stat-row stat-row--inline">
									<p>average</p>
									<h1>{(this.state.totalIncorrect / this.state.totalTests).toFixed(2)}</h1>
									<p>per test</p>
								</div>
							}
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
														<div>
															{
																Object.keys(vocabItem.switchedAnswers).sort((a, b) => {
																	if (a < b) {
																		return -1;
																	}
																	if (a > b) {
																		return 1;
																	}
																	return 0;
																}).map((answer, index) =>
																	<p key={index}>
																		{answer === "" ? <i>skipped</i> : answer}
																		{
																			vocabItem.switchedAnswers[answer] > 1 &&
																			<i>{` (x${vocabItem.switchedAnswers[answer]})`}</i>
																		}
																	</p>
																)
															}
														</div>
													}
												</Collapsible>
												:
												<b>0 mistakes</b>
											}
										</div>
										<div>
											<h2>{vocabItem.definition}</h2>
											{
												vocabItem.notSwitchedCount > 0
												?
												<Collapsible transitionTime={300} trigger={<><b>{vocabItem.notSwitchedCount} mistake{vocabItem.notSwitchedCount !== 1 && "s"}</b><ArrowDropDownRoundedIcon /></>}>
													{
														<div>
															{
																Object.keys(vocabItem.notSwitchedAnswers).sort((a, b) => {
																	if (a < b) {
																		return -1;
																	}
																	if (a > b) {
																		return 1;
																	}
																	return 0;
																}).map((answer, index) =>
																	<p key={index}>
																		{answer === "" ? <i>skipped</i> : answer}
																		{
																			vocabItem.notSwitchedAnswers[answer] > 1 &&
																			<i>{` (x${vocabItem.notSwitchedAnswers[answer]})`}</i>
																		}
																	</p>
																)
															}
														</div>
													}
												</Collapsible>
												:
												<b>0 mistakes</b>
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
		)
	}
}
