import React, { Component } from 'react';
import { HomeRounded as HomeRoundedIcon, QuestionAnswerRounded as QuestionAnswerRoundedIcon, PeopleRounded as PeopleRoundedIcon, SwapHorizRounded as SwapHorizRoundedIcon, DeleteRounded as DeleteRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import Footer from "./Footer";
import { Link } from 'react-router-dom';
import "./css/History.css";

export default class History extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			progressHistoryComplete: [],
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
		document.title = "History | Parandum";
		
		this.state.db.collection("progress")
			.where("uid", "==", this.state.user.uid)
			.orderBy("start_time", "desc")
			.get()
			.then((querySnapshot) => {
				let complete = [];
				let incomplete = [];

				querySnapshot.docs.map((doc) => {
					const data = doc.data();

					if (data.duration !== null) {
						return complete.push({
							id: doc.id,
							setTitle: data.set_title,
							switchLanguage: data.switch_language,
							progress: (data.progress / data.questions.length * 100).toFixed(2),
							mark: (data.progress > 0 ? data.correct.length / data.progress * 100 : 0).toFixed(2),
							mode: data.mode,
						});
					} else {
						return incomplete.push({
							id: doc.id,
							setTitle: data.set_title,
							switchLanguage: data.switch_language,
							progress: (data.progress / data.questions.length * 100).toFixed(2),
							mark: (data.progress > 0 ? data.correct.length / data.progress * 100 : 0).toFixed(2),
							mode: data.mode,
						});
					}
				});

				this.setState({
					progressHistoryComplete: complete,
					progressHistoryIncomplete: incomplete,
				});
			}).catch((error) => {
				console.log(`Couldn't retrieve progress history: ${error}`);
			});
	}

	componentWillUnmount() {
		this.isMounted = false;
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
				delete newState.progressHistoryIncomplete[progressIndex];
				this.setState(newState);
			});
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />
				<main>
					<h1>History</h1>

					{
						this.state.progressHistoryComplete.length > 0 || this.state.progressHistoryIncomplete.length > 0
						?
						<>
						{
							this.state.progressHistoryIncomplete.length > 0 &&
							<div className="progress-history-container">
								<h2>Incomplete</h2>
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
						}
						{
							this.state.progressHistoryComplete.length > 0 &&
							<div className="progress-history-container">
								<h2>Completed</h2>
								<div>
									<h3>Set</h3>
									<h3>Progress</h3>
									<h3>Mark</h3>
									<h3>Mode</h3>
								</div>
								{
									this.state.progressHistoryComplete.map((progressItem) =>
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
											{
												progressItem.mode === "questions"
												?
												<QuestionAnswerRoundedIcon />
												:
												<PeopleRoundedIcon />
											}
										</div>
									)	
								}
							</div>
						}
						</>
						:
						<p>You haven't done any tests yet.</p>
					}
				</main>
				<Footer />
			</div>
		)
	}
}
