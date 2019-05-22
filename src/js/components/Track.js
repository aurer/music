const { h, Component } = preact;

class Track extends Component {
	remapTrack(track) {
		return {
			name: track.name,
			artist: track.artist['#text'],
			album: track.album['#text'],
			image: this.findImage(track.image),
			date: moment.unix(track.date.uts)
		};
	}

	findImage(trackImages) {
		let image = trackImages.reverse().find(image => image['#text'] != '');
		return image
			? image['#text']
			: 'data:image/svg+xml;<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="#333" x="0" y="0" width="300" height="300" /></svg>';
	}

	render(props) {
		let track = this.remapTrack(props.track);
		let style = { backgroundImage: 'url(' + track.image + ')' };
		let searchUri = `spotify:search:${track.artist}%20${track.name}`;
		return (
			<div class="Track">
				<div class="Track-image">
					<img src={track.image} width="300" height="300" />
				</div>
				<div class="Track-info">
					<h2 class="Track-title">{track.name}</h2>
					<p class="Track-artist">{track.artist}</p>
					<small class="Track-date">{track.date.fromNow()}</small>
				</div>
			</div>
		);
	}
}

export default Track;
