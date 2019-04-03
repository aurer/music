const { h, Component } = preact;

class Track extends Component {
	remapTrack(track) {
		return {
			name: track.name,
			artist: track.artist['#text'],
			album: track.album['#text'],
			image: this.findImage(track.image)
		};
	}

	findImage(trackImages) {
		let image = trackImages.reverse().find(image => image['#text'] != '');
		return image ? image['#text'] : 'https://unsplash.it/300/300';
	}

	render(props) {
		let track = this.remapTrack(props.track);
		let style = { backgroundImage: 'url(' + track.image + ')' };
		let searchUri = `spotify:search:${track.artist}%20${track.name}`;
		return (
			<div class="Track-container">
				<div class="Track">
					<a href={searchUri} class="Track-image" style={style}>
						<img src={track.image} />
					</a>
					<div class="Track-info">
						<h2 class="Track-name">
							<a href={searchUri}>{track.name}</a>
						</h2>
						<div class="Track-artist">{track.artist}</div>
					</div>
				</div>
			</div>
		);
	}
}

export default Track;
