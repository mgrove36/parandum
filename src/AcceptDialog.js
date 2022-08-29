import React from 'react';
import Button from './Button';

export default function ConfirmationDialog(props) {
	return (
		<>
			<div className="overlay" onClick={props.acceptFunction}></div>
			<div className="overlay-content confirmation-dialog accept-dialog">
				<h3>{props.message}</h3>
				<div className="button-container button-container--center">
					<Button
						onClick={props.acceptFunction}
					>
						Ok
					</Button>
				</div>
			</div>
		</>
	)
}
