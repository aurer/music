const { h } = preact;

export const ArrowLeft = () => {
	return (
		<svg width="20" height="20" viewBox="0 0 768 768">
			<path
				fill="#fff"
				d="M406.624 585.376l-169.376-169.376h370.752c17.664 0 32-14.336 32-32s-14.336-32-32-32h-370.752l169.376-169.376c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0l-224 224c-3.072 3.072-5.376 6.592-6.944 10.368-1.632 3.904-2.432 8.096-2.432 12.256 0 8.192 3.136 16.384 9.376 22.624l224 224c12.512 12.512 32.768 12.512 45.248 0s12.512-32.768 0-45.248z"
			/>
		</svg>
	);
};

export const ArrowRight = () => {
	return (
		<svg width="20" height="20" viewBox="0 0 768 768">
			<path
				fill="#fff"
				d="M361.376 182.624l169.376 169.376h-370.752c-17.664 0-32 14.336-32 32s14.336 32 32 32h370.752l-169.376 169.376c-12.512 12.512-12.512 32.768 0 45.248s32.768 12.512 45.248 0l224-224c2.944-2.944 5.312-6.464 6.944-10.368 3.232-7.84 3.232-16.672 0-24.512-1.568-3.776-3.872-7.296-6.944-10.368l-224-224c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248z"
			/>
		</svg>
	);
};

export const Refresh = () => {
	return (
		<svg width="18" height="18" viewBox="0 0 768 768">
			<path
				fill="#fff"
				d="M142.496 298.688c23.584-66.656 71.904-117.408 131.072-145.664s129.024-33.888 195.648-10.304c37.952 13.44 70.592 34.816 95.456 60.16l90.56 85.12h-111.232c-17.664 0-32 14.336-32 32s14.336 32 32 32h191.904c0.16 0 0.288 0 0.448 0 4.384-0.032 8.576-0.992 12.352-2.624 3.808-1.632 7.328-4.032 10.368-7.2 0.384-0.416 0.768-0.832 1.152-1.248 2.4-2.784 4.256-5.856 5.536-9.12s2.048-6.752 2.208-10.432c0.032-0.48 0.032-0.928 0.032-1.376v-192c0-17.664-14.336-32-32-32s-32 14.336-32 32v118.048l-93.632-87.968c-31.744-32.32-72.672-58.976-119.776-75.648-83.296-29.472-170.72-22.368-244.576 12.864s-134.368 98.752-163.84 182.048c-5.92 16.64 2.816 34.912 19.456 40.832s34.944-2.816 40.832-19.488zM64 521.984l94.56 88.864c61.728 61.792 143.68 93.056 225.536 93.088s163.808-31.2 226.304-93.664c35.328-35.328 60.832-77.024 75.552-119.84 5.76-16.704-3.136-34.912-19.872-40.672s-34.912 3.136-40.672 19.872c-11.552 33.6-31.776 66.912-60.256 95.392-50.016 49.984-115.488 74.944-181.024 74.944s-131.008-25.024-181.728-75.712l-89.6-84.256h111.2c17.664 0 32-14.336 32-32s-14.336-32-32-32h-191.904c-0.16 0-0.288 0-0.448 0-4.384 0.032-8.576 0.992-12.352 2.624-3.808 1.632-7.328 4.032-10.368 7.2-0.384 0.416-0.768 0.832-1.152 1.248-2.4 2.784-4.256 5.856-5.536 9.12s-2.048 6.752-2.208 10.432c-0.032 0.48-0.032 0.928-0.032 1.376v192c0 17.664 14.336 32 32 32s32-14.336 32-32z"
			/>
		</svg>
	);
};

export const Youtube = () => {
	return (
		<svg width="40" height="40" viewBox="0 0 512 512">
			<path
				fill="#ff0000"
				d="M506.9 153.6c0 0-5-35.3-20.4-50.8-19.5-20.4-41.3-20.5-51.3-21.7-71.6-5.2-179.1-5.2-179.1-5.2h-0.2c0 0-107.5 0-179.1 5.2-10 1.2-31.8 1.3-51.3 21.7-15.4 15.5-20.3 50.8-20.3 50.8s-5.1 41.4-5.1 82.9v38.8c0 41.4 5.1 82.9 5.1 82.9s5 35.3 20.3 50.8c19.5 20.4 45.1 19.7 56.5 21.9 41 3.9 174.1 5.1 174.1 5.1s107.6-0.2 179.2-5.3c10-1.2 31.8-1.3 51.3-21.7 15.4-15.5 20.4-50.8 20.4-50.8s5.1-41.4 5.1-82.9v-38.8c-0.1-41.4-5.2-82.9-5.2-82.9zM203.1 322.4v-143.9l138.3 72.2-138.3 71.7z"
			/>
		</svg>
	);
};

export const Spotify = () => {
	return (
		<svg width="40" height="40" viewBox="0 0 512 512">
			<path
				fill="#1ed761"
				d="M256 0c-140.8 0-256 115.2-256 256s115.2 256 256 256 256-115.2 256-256-113.9-256-256-256zM373.8 369.9c-5.1 7.7-14.1 10.2-21.8 5.1-60.2-37.1-135.7-44.8-225.3-24.3-9 2.6-16.6-3.8-19.2-11.5-2.6-9 3.8-16.6 11.5-19.2 97.3-21.8 181.8-12.8 248.3 28.2 9 3.8 10.3 14 6.5 21.7zM404.5 299.5c-6.4 9-17.9 12.8-26.9 6.4-69.1-42.2-174.1-55-254.7-29.4-10.2 2.6-21.8-2.6-24.3-12.8-2.6-10.2 2.6-21.8 12.8-24.3 93.4-28.2 208.6-14.1 288 34.6 7.6 3.8 11.5 16.6 5.1 25.5zM407 227.8c-81.9-48.6-218.9-53.8-297-29.4-12.8 3.8-25.6-3.8-29.4-15.4-3.8-12.8 3.8-25.6 15.4-29.4 90.9-26.9 240.6-21.8 335.4 34.6 11.5 6.4 15.4 21.8 9 33.3-6.5 8.9-21.8 12.7-33.4 6.3z"
			/>
		</svg>
	);
};
