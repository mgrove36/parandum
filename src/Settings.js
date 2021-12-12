import React, { Component } from 'react';
import { HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import NavBar from "./NavBar";
import Button from "./Button";
import { withRouter } from "react-router-dom";
import SettingsContent from "./SettingsContent";
import Footer from "./Footer";
import "./css/Donation.css";

export default withRouter(class Settings extends Component {
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
			soundInput: this.props.sound,
			themeInput: this.props.theme,
			coloredEdgesInput: this.props.coloredEdges,
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
		document.title = "Settings | Parandum";

		this.props.page.load();

		this.props.logEvent("page_view");
	}

	componentWillUnmount() {
		this.isMounted = false;
		this.props.page.unload();
	}

	handleSoundInputChange = (event) => {
		this.setState({
			soundInput: event.target.checked,
		});
	}

	handleThemeInputChange = (newTheme) => {
		if (this.state.themeInput !== newTheme) this.setState({
			themeInput: newTheme,
		});
	}

	handleColoredEdgesInputChange = (event) => {
		this.setState({
			coloredEdgesInput: event.target.checked,
		});
	}

	saveSettings = (globalChange) => {
		this.props.handleSoundChange(this.state.soundInput, globalChange);
		this.props.handleThemeChange(this.state.themeInput, globalChange);
		this.props.handleColoredEdgesChange(this.state.coloredEdgesInput, globalChange);
		this.props.history.push("/");
	}

	render() {
		return (
			<div>
				<NavBar items={this.state.navbarItems} />
				<main>
					<SettingsContent
						sound={this.props.sound}
						theme={this.props.theme}
						saveSettings={this.saveSettings}
						handleSoundInputChange={this.handleSoundInputChange}
						handleThemeInputChange={this.handleThemeInputChange}
						handleColoredEdgesInputChange={this.handleColoredEdgesInputChange}
						themes={this.props.themes}
						soundInput={this.state.soundInput}
						themeInput={this.state.themeInput}
						coloredEdgesInput={this.state.coloredEdgesInput}
					/>

					<div className="settings-save-container">
						<Button
							onClick={() => this.saveSettings(true)}
						>
							Save
						</Button>
						<Button
							onClick={() => this.saveSettings(false)}
						>
							Save for this session
						</Button>
					</div>

					<h1 className="donation-header">Appreciate my work?</h1>
					<p>Projects like Parandum take a massive amount of time, effort, and money to run! I'm really grateful for all your support.</p>
					<div className="donation-links">
						<a href="https://www.buymeacoffee.com/mgrove36" target="_blank" rel="noreferrer">
							<img
								src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png"
								alt="Buy me a coffee"
							/>
						</a>
						<a href="https://www.paypal.com/donate/?hosted_button_id=AW7XJ7KFLC7JG" target="_blank" rel="noreferrer">
							<img
								src="https://pics.paypal.com/00/s/M2E5OWQyMjItZWU1My00YmEwLTljNmYtYTA2ZTI1OGUzMjA5/file.PNG"
								alt="Donate with PayPal"
							/>
						</a>
					</div>
				</main>
				<Footer showTerms={true} />
			</div>
		)
	}
})
