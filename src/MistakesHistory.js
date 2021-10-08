import React, { Component } from 'react';
import { HistoryRounded as HistoryRoundedIcon, HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Footer from "./Footer";
import "./css/History.css";
import "./css/MistakesHistory.css";

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
					newState.incorrectAnswers = incorrectAnswers.sort((a,b) => b.count + b.switchedCount - a.count - a.switchedCount);
					newState.totalIncorrect = querySnapshot.docs.length;
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
								this.state.incorrectAnswers.length > 0 &&
								<div className="stat-row stat-row--inline">
									<h1>{this.state.incorrectAnswers[0].definition}</h1>
									<p>meaning</p>
									<h1>{this.state.incorrectAnswers[0].term}</h1>
									<p>is the most common</p>
								</div>
							}
							{
								this.state.totalTests > 0 &&
								<div className="stat-row stat-row--inline">
									<h1>{(this.state.totalIncorrect / this.state.totalTests).toFixed(2)}</h1>
									<p>mistakes per test on average</p>
								</div>
							}
						</div>
						<div className="mistakes-history-container">
							{
								this.state.incorrectAnswers.map((vocabItem, index) => (
									<React.Fragment key={index}>
										<div>
											<h2>{vocabItem.term}</h2>
											<p><b>{vocabItem.switchedCount} mistake{vocabItem.switchedCount !== 1 && "s"}{vocabItem.switchedCount > 0 && ":"}</b></p>
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
										</div>
										<div>
											<h2>{vocabItem.definition}</h2>
											<p><b>{vocabItem.count} mistake{vocabItem.count !== 1 && "s"}{vocabItem.count > 0 && ":"}</b></p>
											{
												vocabItem.count > 0 &&
												<div>
													{
														vocabItem.answers.sort((a,b) => {
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
