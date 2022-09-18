import React, { Component } from "react";
import { HomeRounded as HomeRoundedIcon, ArrowForwardRounded as ArrowForwardRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Button from "./Button";
import { Link, withRouter } from "react-router-dom";
import Checkbox from '@material-ui/core/Checkbox';
import TestStart from "./TestStart";
import ClassicTestStart from "./ClassicTestStart";
import LivesTestStart from "./LivesTestStart";
import CountdownTestStart from "./CountdownTestStart";

import "./css/SearchSets.css";

const paginationFrequency = 24;

export default withRouter(class SearchSets extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: props.user,
			db: props.db,
			loading: false,
			loadingSets: false,
			functions: {
				createProgress: props.functions.httpsCallable("createProgress"),
			},
			navbarItems: [
				{
					type: "link",
					link: "/",
					icon: <HomeRoundedIcon />,
					hideTextMobile: true,
				}
			],
			selections: {},
			sets: [],
			pageNumber: 0,
			loadedAllSets: false,
			showTestStart: false,
			showClassicTestStart: false,
			showLivesTestStart: false,
			searchInput: "",
			ignoreCaps: false,
			ignoreAccents: false,
			showNumberOfAnswers: false,
			switchLanguage: false,
			sliderValue: 1,
			totalTestQuestions: 1,
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
		this.loadSets().then(() => {
			if (this.searchInputRef) this.searchInputRef.focus();
			this.props.page.load();
			this.props.logEvent("page_view");
		});
	}

	componentWillUnmount() {
		this.isMounted = false;
		this.props.page.unload();
	}

	loadSets = (reload = false) => {
		if (!this.state.loadingSets) {
			this.setState({
				loadingSets: true,
			});

			const setsRef = this.state.db.collection("sets")
				.where("public", "==", true)
				.where('title', '>=', this.state.searchInput)
				.where('title', '<=', this.state.searchInput + '\uf8ff')
				.orderBy("title")
				.orderBy("owner");

			let completeSetsRef;

			if (this.state.pageNumber === 0 || reload) {
				completeSetsRef = setsRef.limit(paginationFrequency);
			} else {
				completeSetsRef = setsRef.startAfter(this.state.sets[this.state.sets.length - 1]).limit(paginationFrequency);
			}
			
			return completeSetsRef.get().then((querySnapshot) => {
				let selections = this.state.selections;
				querySnapshot.docs.map((doc) => selections[doc.id] = false);
				
				this.setState({
					sets: reload ? querySnapshot.docs : this.state.sets.concat(querySnapshot.docs),
					selections: selections,
					pageNumber: this.state.pageNumber + 1,
					loadedAllSets: querySnapshot.docs.length === 0,
					loadingSets: false,
				});
			});
		}
	}

	stopLoading = () => {
		this.setState({
			canStartTest: true,
			loading: false,
		});
	}

	showTestStart = () => {
		if (this.state.canStartTest) {
			this.setState({
				showTestStart: true,
				totalTestQuestions: 1,
			});
		}
	}

	hideTestStart = () => {
		this.setState({
			showTestStart: false,
		});
	}

	startTest = (mode) => {
		if (this.state.canStartTest) {
			const selections = Object.keys(this.state.selections)
				.filter(x => this.state.selections[x]);
			this.state.functions.createProgress({
				sets: selections,
				switch_language: this.state.switchLanguage,
				mode: mode,
				limit: this.state.sliderValue,
				ignoreCaps: this.state.ignoreCaps,
				ignoreAccents: this.state.ignoreAccents,
				showNumberOfAnswers: this.state.showNumberOfAnswers,
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

	showIndividualTestPrompt = async (mode) => {
		if (!this.state.loading) {
			if (mode === "classic") {
				this.setState({
					loading: true,
				})
				const setIds = Object.keys(this.state.selections)
					.filter(x => this.state.selections[x]);

					const totalTestQuestions = (await Promise.all(setIds.map((setId) =>
					this.state.db.collection("sets")
					.doc(setId)
					.collection("vocab")
					.get()
					.then(querySnapshot => querySnapshot.docs.length)
				))).reduce((a, b) => a + b);
				
				this.setState({
					showTestStart: false,
					showClassicTestStart: true,
					sliderValue: totalTestQuestions,
					switchLanguage: false,
					totalTestQuestions: totalTestQuestions,
					loading: false,
				});
			} else if (mode === "lives") {
				this.setState({
					showTestStart: false,
					showLivesTestStart: true,
					switchLanguage: false,
					sliderValue: 5,
				});
			} else {
				// countdown
				// this.setState({
					// 	showTestStart: false,
					// 	showCountdownTestStart: true,
					//	switchLanguage: false,
					// });
			}
		}
	}

	hideClassicTestStart = () => {
		this.setState({
			showClassicTestStart: false,
		});
	}

	hideLivesTestStart = () => {
		this.setState({
			showLivesTestStart: false,
		});
	}

	hideCountdownTestStart = () => {
		this.setState({
			showCountdownTestStart: false,
		});
	}

	changeSliderValue = (value) => {
		if (value >= 1 && value <= 999) this.setState({
			sliderValue: value,
		});
	}

	handleSwitchLanguageChange = (event) => {
		this.setState({
			switchLanguage: event.target.checked,
		});
	}

	handleIgnoreCapsChange = (event) => {
		this.setState({
			ignoreCaps: event.target.checked,
		});
	}

	handleIgnoreAccentsChange = (event) => {
		this.setState({
			ignoreAccents: event.target.checked,
		});
	}

	handleShowNumberOfAnswersChange = (event) => {
		this.setState({
			showNumberOfAnswers: event.target.checked,
		});
	}

	handleSearchInput = (event) => {
		if (!this.state.loadingSets) {
			this.setState({
				searchInput: event.target.value,
			});
		}
	}

	search = () => {
		this.loadSets(true);
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />

				<main>
					<div className="page-header">
						<h1>Search Sets</h1>
						<div className="button-container">
							<Button
								onClick={this.showTestStart}
								disabled={!this.state.canStartTest}
							>
								Test ({Object.values(this.state.selections).filter(x => x === true).length})
							</Button>
						</div>
					</div>

					<form className="search-box-container" onSubmit={(e) => e.preventDefault()} >
						<input type="submit" className="form-submit" onClick={this.search} />
						<input
							type="text"
							className="search-box"
							onChange={this.handleSearchInput}
							value={this.state.searchInput}
							ref={inputEl => (this.searchInputRef = inputEl)}
							autoComplete="off"
							placeholder="Search is case-sensitive"
						/>
						<Button
							onClick={this.search}
							icon={<ArrowForwardRoundedIcon />}
							className="button--round"
							disabled={this.state.loadingSets}
							loading={this.state.loadingSets}
						></Button>
					</form>

					<div className="checkbox-list">
						{
							this.state.sets.map(set =>
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
					{
						!this.state.loadedAllSets && this.state.sets.length % paginationFrequency === 0 &&
						<Button
							onClick={() => this.loadSets()}
							disabled={this.state.loadingSets}
							className="load-more-button"
						>
							Load More
						</Button>
					}
				</main>
				<Footer />

				{
					this.state.showTestStart &&
					<TestStart
						hideTestStart={this.hideTestStart}
						showIndividualTestPrompt={this.showIndividualTestPrompt}
						loading={this.state.loading}
					/>
				}
				{
					this.state.showClassicTestStart &&
					<ClassicTestStart
						hide={this.hideClassicTestStart}
						startTest={this.startTest}
						max={this.state.totalTestQuestions}
						sliderValue={this.state.sliderValue}
						onSliderChange={this.changeSliderValue}
						switchLanguage={this.state.switchLanguage}
						ignoreCaps={this.state.ignoreCaps}
						ignoreAccents={this.state.ignoreAccents}
						showNumberOfAnswers={this.state.showNumberOfAnswers}
						handleSwitchLanguageChange={this.handleSwitchLanguageChange}
						handleIgnoreCapsChange={this.handleIgnoreCapsChange}
						handleIgnoreAccentsChange={this.handleIgnoreAccentsChange}
						handleShowNumberOfAnswersChange={this.handleShowNumberOfAnswersChange}
						loading={this.state.loading}
					/>
				}
				{
					this.state.showLivesTestStart &&
					<LivesTestStart
						hide={this.hideLivesTestStart}
						startTest={this.startTest}
						max={20}
						sliderValue={this.state.sliderValue}
						onSliderChange={this.changeSliderValue}
						switchLanguage={this.state.switchLanguage}
						ignoreCaps={this.state.ignoreCaps}
						ignoreAccents={this.state.ignoreAccents}
						showNumberOfAnswers={this.state.showNumberOfAnswers}
						handleSwitchLanguageChange={this.handleSwitchLanguageChange}
						handleIgnoreCapsChange={this.handleIgnoreCapsChange}
						handleIgnoreAccentsChange={this.handleIgnoreAccentsChange}
						handleShowNumberOfAnswersChange={this.handleShowNumberOfAnswersChange}
						loading={this.state.loading}
					/>
				}
				{
					this.state.showCountdownTestStart &&
					<CountdownTestStart
						hide={this.hideCountdownTestStart}
						startTest={this.startTest}
					/>
				}
			</div>
		)
	}
})
