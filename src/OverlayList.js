import React from 'react';
import "./css/PopUp.css";
import "./css/OptionsListOverlay.css";

export default function OverlayList(props) {
  return (
	<>
		<div className="overlay" onClick={props.closeOverlay}></div>
		<div className="overlay-content options-list-overlay-content">
			{props.options.map((option) => (
			<h3 key={option} onClick={() => props.selectOption(option)}>
				{option}
			</h3>
			))}

			<div onClick={props.closeOverlay}>Cancel</div>
		</div>
	</>
  );
}
