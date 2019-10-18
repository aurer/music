import { h, Component}  from '../lib/preact.js';

class Track extends Component {
	remapTrack(track) {
		return {
			name: track.name,
			artist: track.artist['#text'],
			album: track.album['#text'],
			image: this.findImage(track.image),
			time: this.trackTime(track)
		};
	}

	trackTime(track) {
		let time = 'a while ago';

		if (track['@attr'] && track['@attr'].nowplaying) {
			time = 'now';
		}

		if (track.date) {
			time = moment.unix(track.date.uts).fromNow();
		}

		return time;
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
		let styles = {
			backgroundImage: 'url(' + track.image + ')'
		};
		return (
			<div class="Track">
				<div class="Track-image" style={styles}>
					<img src={track.image} width="300" height="300" />
				</div>
				<div class="Track-info">
					<h2 class="Track-title">{track.name}</h2>
					<p class="Track-artist">{track.artist}</p>
					<small class="Track-date">{track.time}</small>
				</div>
			</div>
		);
	}
}

export default Track;
