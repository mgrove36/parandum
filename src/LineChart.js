import React from 'react';
import Chart from "react-apexcharts";

export default function LineChart (props) {
	const options = {
		xaxis: {
			type: "datetime",
			tooltip: {
				enabled: false,
			},
		},
		yaxis: {
			min: 0,
			max: 100,
			labels: {
				formatter: (value) => `${value.toFixed(0)}%`
			},
			tickAmount: 5,
		},
		chart: {
			foreColor:
				getComputedStyle(
					document.querySelector("#root > div")
				).getPropertyValue("--text-color")
				.trim(),
			toolbar: {
				show: false,
			},
			fontFamily: "Hind, sans-serif",
			offsetX: -15,
			zoom: {
				enabled: false,
			},
		},
		colors: [
			getComputedStyle(
				document.querySelector("#root > div")
			).getPropertyValue("--primary-color")
			.trim()
		],
		tooltip: {
			theme: "dark",
			x: {
				show: typeof props.sets !== "undefined",
				formatter: (value, opt) => typeof props.sets !== "undefined" ? props.sets[opt.dataPointIndex] : null,
			},
		},
		stroke: {
			width: 3,
			curve: 'smooth',
		},
		grid: {
			borderColor: getComputedStyle(
				document.querySelector("#root > div")
			).getPropertyValue("--overlay-color")
				.trim(),
			xaxis: {
				lines: {
					show: true
				}
			},
		},
		markers: {
			size: 1
		},
		responsive: [{
			breakpoint: 600,
			options: {
				chart: {
					height: "200px",
				},
			},
		}],
	};
	const series = [
		{
			name: "",
			data: props.data,
		}
	];

  	return (
		<>
			<Chart
				options={options}
				series={series}
				type="line"
				height="250px"
				className="chart"
			/>
		</>
	)
}