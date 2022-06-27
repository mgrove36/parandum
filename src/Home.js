import React, { useEffect } from "react";
import "@material-ui/core";
import { AccountCircleRounded as AccountCircleIcon, ArrowDropDownRounded as ArrowDropDownRoundedIcon } from "@material-ui/icons";
import "./css/Home.css";
import NavBar from './NavBar';
import Footer from "./Footer";

import Collapsible from "react-collapsible";

export default function Home(props) {
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

	const page = props.page;
	const logEvent = props.logEvent;

	useEffect(() => {
		if (page) {
			page.load();
			return () => page.unload();
		}
		if (logEvent) logEvent("page_view");
	}, [logEvent, page]);

	return (
		<div>
			<NavBar items={navbarItems} />

			<main>
				<div className="description-section">
					<h1>Parandum</h1>
					<p>A language-learning platform built by Matthew Grove. With current support for sharing sets and use on mobile, more features are coming soon!</p>
					<br/>
					<p>To get started, click login 👆</p>
					<br/>
					<p>If you have any feedback, please feel free to email me at <a href="mailto:parandum@mgrove.uk">parandum@mgrove.uk</a>.</p>
					<br/>
					<h2>What's New?</h2>
					<Collapsible transitionTime={300} trigger={<>v2.0.6<ArrowDropDownRoundedIcon /></>}>
						<ul>
							<li>Add option to show number of answers for each prompt</li>
							<li>Ensure test options are carried over to new tests that are made from pre-existing ones (i.e. with the restart test buttons)</li>
						</ul>
						{/* TODO: style */}
					</Collapsible>
				</div>
			</main>
			<Footer />
		</div>
	)
}
