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
		return (
			<div class="Track">
				<img src={track.image} />
				<h2 class="Track-name">{track.name}</h2>
				<div class="Track-artist">{track.artist}</div>
			</div>
		);
	}
}

export default Track;
