import React from 'react';
import Home from './Home';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import "./css/Login.css";
import "./css/PopUp.css";
import { Link } from 'react-router-dom';
import "@material-ui/core";
import { CloseRounded as CloseRoundedIcon } from "@material-ui/icons";

import "firebase/auth";

export default function Login(props) {
	const auth = props.auth;
	const uiConfig = {
		signInFlow: 'redirect',
		signInSuccessUrl: '/',
		signInOptions: [
			props.firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			"microsoft.com",
			props.firebase.auth.EmailAuthProvider.PROVIDER_ID
		],
		credentialHelper: props.firebase.auth.CredentialHelper.GOOGLE_YOLO,
		callbacks: {
			signInSuccessWithAuthResult: () => false,
		},
	};

	document.body.style.overflow = "hidden";
	document.title = "Login | Parandum";

	return (
		<>
			<Home />
			<Link to="/" className="overlay"></Link>
			<div className="overlay-content login-overlay-content">
				<h1>Login</h1>
				<StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
				<Link className="popup-close-button" to="/">
					<CloseRoundedIcon />
				</Link>
			</div>
		</>
	)
}
