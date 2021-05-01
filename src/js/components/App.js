import { h, render, Component }  from '../lib/preact.js';
import Tracks from './Tracks.js';
import Track from './Track.js';
import Paging from './Paging.js';
import Scrobbler from '../services/scrobbler.js';
const scrobbler = new Scrobbler('philmau', 'ccfce33b35f8480c2413f2a642fa2c6a');

class App extends Component {
	constructor() {
		super();
		this.state = {
			page: 1,
			total: 0,
			perPage: 20,
			totalPages: 0,
			tracks: Array.apply({}, Array(20)),
			playingTrack: null
		};
	}

	componentWillMount() {
		this.fetchTracks();
	}

	handlePaging(page) {
		this.setState(
			{
				page: page,
				tracks: Array.apply({}, Array(this.state.perPage))
			},
			this.fetchTracks
		);
	}

	fetchTracks() {
		scrobbler.getRecentTracks(this.state.perPage, this.state.page).then(data => {
			let attr = data.recenttracks['@attr'];
			this.setState({
				page: parseInt(attr.page),
				total: parseInt(attr.total),
				perPage: parseInt(attr.perPage),
				totalPages: parseInt(attr.totalPages),
				tracks: this.getPlayedTracks(data.recenttracks.track),
				playingTrack: this.getPlayingTrack(data.recenttracks.track)
			});
		});
	}

	getPlayedTracks(tracks) {
		return tracks.filter(t => {
			if (t['@attr']?.nowplaying) {
				return false
			}
			return true
		})
	}

	getPlayingTrack(tracks) {
		return tracks.find(t => t['@attr']?.nowplaying)
	}

	render(props, { tracks, playingTrack, page, total, perPage, totalPages }) {
		return (
			<div class="App">
				<main class="App-main">
					<Tracks tracks={tracks.slice(0, this.state.perPage)} page={page} />
				</main>
				<footer>
					<div class="App-nowPlaying">
						{playingTrack && <Track track={playingTrack} />}
					</div>
					<Paging page={page} totalPages={totalPages} onPage={this.handlePaging.bind(this)} />
				</footer>
			</div>
		);
	}
}

export default App;
