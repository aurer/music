const { h, Component } = preact;
import * as Icon from './Icons.js';

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
		let name = track.name.replace(/\s+/, '+');
		let artist = track.artist.replace(/\s+/, '+');
		let spotifyUri = `spotify:search:${artist}%20${name}`;
		let youtubeUri = `https://www.youtube.com/results?search_query=${artist}+-+${name}`;
		return (
			<div class="Track">
				<div class="Track-image" style={style}>
					<img src={track.image} width="300" height="300" />
				</div>
				<div class="Track-info">
					<h2 class="Track-title">{track.name}</h2>
					<p class="Track-artist">{track.artist}</p>
					<small class="Track-date">{track.time}</small>
					<a
						href={spotifyUri}
						class="Track-search Track-search--spotify"
						target="_blank"
						title="Search for this track on Spotify"
					>
						<Icon.Spotify />
					</a>
					<a
						href={youtubeUri}
						class="Track-search Track-search--youtube"
						target="_blank"
						title="Search for this track on YouTube"
					>
						<Icon.Youtube />
					</a>
				</div>
			</div>
		);
	}
}

export default Track;
