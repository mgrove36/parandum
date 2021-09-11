import React from "react";

export default function ProgressStats(props) {
	return (
		<div className="progress-stats">
			<div className="progress-stat-row-container">
				<div className="stat-row stat-row--inline stat-row--no-gap">
					<h1>{props.grade.toFixed(2)}</h1>
					<p>%</p>
				</div>
				<div className="stat-row stat-row--inline">
					<h1>{props.correct}</h1>
					<p>correct</p>
				</div>
				<div className="stat-row stat-row--inline">
					<h1>{props.incorrect}</h1>
					<p>mistake{ props.incorrect !== 1 && "s" }</p>
				</div>
				<div className="stat-row stat-row--inline">
					<h1>{props.progress}</h1>
					<p>guess{props.progress !== 1 && "es"}</p>
				</div>
			</div>
			<div className="progress-bar">
				<div style={{ width: props.correct > 0 && props.totalVocabItems > 0 ? `${(props.correct / props.totalVocabItems * 100)}%` : "0" }}>
					<p>{props.correct}/{props.totalVocabItems}</p>
				</div>
			</div>
		</div>
	)
}
