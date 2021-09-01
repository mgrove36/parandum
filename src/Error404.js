import React from 'react';
import NavBar from './NavBar';
import Footer from "./Footer";
import { HomeRounded as HomeRoundedIcon } from "@material-ui/icons";
import LinkButton from "./LinkButton";

export default function PageNotFound() {
	const navbarItems = [
		{
			type: "link",
			link: "/",
			icon: <HomeRoundedIcon />,
			hideTextMobile: true,
		}
	];

	document.title = "Error 404 | Parandum";

	return (
		<div>
			<NavBar items={navbarItems}/>
			<main>
				<h1>Error 404</h1>
				<h3>Sorry, but we can't find that page.</h3>
			</main>
			<Footer />
		</div>
	)
}
