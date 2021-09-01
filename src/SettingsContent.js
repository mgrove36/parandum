import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import { CheckRounded as CheckRoundedIcon } from "@material-ui/icons";
import Button from "./Button";

import "./css/SettingsContent.css";

export default class SettingsContent extends Component {
	render() {
		return (
			<>
				<h1 className="settings-header">Settings</h1>
				<label className="settings-sound-container">
					<Checkbox
						checked={this.props.soundInput}
						onChange={this.props.handleSoundInputChange}
						inputProps={{ 'aria-label': 'checkbox' }}
					/>
					<span>Sound</span>
				</label>

				<h2 className="settings-theme-header">Theme</h2>
				<div className="settings-themes-container">
					{
						this.props.themes.map((theme) =>
							<Button
								onClick={() => this.props.handleThemeInputChange(theme)}
								icon={this.props.themeInput === theme && <CheckRoundedIcon />}
								className={`background--${theme}`}
								key={theme}
							>
								{
									theme.split("-")
										.map((word) =>
											word[0].toUpperCase() + word.substring(1)
										).join(" ")
								}
							</Button>
						)
					}
				</div>
			</>
		)
	}
}