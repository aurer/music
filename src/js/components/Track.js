const { h, Component } = preact;

class Track extends Component {
	remapTrack(track) {
		return {
			name: track.name,
			artist: track.artist['#text'],
			album: track.album['#text']
		};
	}

	render(props) {
		let track = this.remapTrack(props.track);
		return (
			<div class="Track">
				<h2 class="Track-name">{track.name}</h2>
				<div class="Track-artist">{track.artist}</div>
			</div>
		);
	}
}

export default Track;
