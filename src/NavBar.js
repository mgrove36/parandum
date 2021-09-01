import React from 'react';
import { Link } from "react-router-dom";
import BannerLogo from "./images/banner.png";
import SmallLogo from "./images/logo.png";
import "./css/NavBar.css";
import Button from "./Button";
import LinkButton from "./LinkButton";

export default function Navbar(props) {
	const navbarItems = props.items;
	return (
		<nav>
			<Link to="/">
				<img className="navbar-logo" id="banner-logo" src={BannerLogo} alt="Parandum Logo" />
				<img className="navbar-logo" id="small-logo" src={SmallLogo} alt="Parandum Logo" />
			</Link>

			{ navbarItems ?
				<div className="navbar-items">
					{navbarItems.map((item, index) => {
						if (item.type === "link") {
							return <LinkButton className={`${item.hideTextMobile ? "button--hide-text-mobile" : ""} ${item.icon && !item.name ? "button--round" : ""}`} key={index} to={item.link} icon={item.icon}>{item.name}</LinkButton>
						} else if (item.type === "button") {
							return <Button className={`${item.hideTextMobile ? "button--hide-text-mobile" : ""} ${item.icon && !item.name ? "button--round" : ""}`} key={index} onClick={item.onClick} icon={item.icon}>{item.name}</Button>
						}
						return false;
					})}
				</div>
				:
				""
			}
		</nav>
	)
}
