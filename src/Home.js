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
					<p>If you have any feedback, please feel free to email us at <a href="mailto:contact@parandum.mgrove.uk">contact@parandum.mgrove.uk</a>.</p>
					<br/>
					<div className="whats-new">
						<h2>What's New?</h2>
						<Collapsible open={true} transitionTime={500} easing="ease" trigger={<>v2.3.3<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Bug fixes:</li>
								<ul>
									<li>On the search page, all sets are shown instead of only the last 50 showing and previous ones being overwritten</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.3.2<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Bug fixes:</li>
								<ul>
									<li>On the search page, all sets are now visible rather than just the first 48</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.3.0<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Add option to ignore accents during tests</li>
								<li>Update cookie notice</li>
								<li>Update contact email address</li>
								<li>Add ability to bulk-create sets and bulk-add vocabulary</li>
								<li>Bug fixes:</li>
								<ul>
									<li>Minor styling improvements</li>
									<li>Efficiency improvements</li>
									<li>When a set is in a group and the group is deleted, navigating to the home screen no longer throws an error</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.2.0<ArrowDropDownRoundedIcon /></>} >
							<ul>
								<li>Allow saving a set with no changes</li>
								<li>Bug fixes:</li>
								<ul>
									<li>Minor styling improvements</li>
									<li>Efficiency improvements</li>
									<li>Users are now correctly removed from groups</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.1.9<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Add an optional on-screen configurable keyboard during tests for easier access to accented characters</li>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.1.8<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Bug fixes:</li>
								<ul>
									<li>Test options are now set correctly when starting tests</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.1.7<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Bug fixes:</li>
								<ul>
									<li>Ensure backwards-compatibility with old versions of Parandum</li>
								</ul>
							</ul>
						</Collapsible>
						<Collapsible transitionTime={500} easing="ease" trigger={<>v2.1.6<ArrowDropDownRoundedIcon /></>}>
							<ul>
								<li>Add option to show number of answers for each prompt</li>
								<li>Ensure test options are carried over to new tests that are made from pre-existing ones (i.e. with the restart test buttons)</li>
							</ul>
							{/* TODO: style */}
						</Collapsible>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
