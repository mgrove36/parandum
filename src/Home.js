import React from 'react';
import "@material-ui/core";
import { AccountCircleRounded as AccountCircleIcon } from "@material-ui/icons";
import "./css/Home.css";
import NavBar from './NavBar';
import Footer from "./Footer";

export default function Home() {
	const navbarItems = [
		{
			type: "link",
			name: "Login",
			link: "/login",
			icon: <AccountCircleIcon />,
			hideTextMobile: false,
		}
	];
	
	document.title = "Parandum";

	return (
		<div>
			<NavBar items={navbarItems} />

			<main>
				<div className="description-section">
					<h1>Parandum</h1>
					<p>The next-generation ad-free language-learning platform</p>
				</div>
			</main>
			<Footer />
		</div>
	)
}
