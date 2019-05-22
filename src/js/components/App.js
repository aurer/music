const { h, Component } = preact;
import Tracks from './Tracks.js';
import Paging from './Paging.js';
import Scrobbler from '../services/scrobbler.js';
const scrobbler = new Scrobbler('philmau', 'ccfce33b35f8480c2413f2a642fa2c6a');

class App extends Component {
	constructor() {
		super();
		this.state = {
			page: 1,
			total: 0,
			perPage: 10,
			totalPages: 0,
			tracks: Array.apply({}, Array(10))
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
				tracks: data.recenttracks.track
			});
		});
	}

	render(props, { tracks, page, total, perPage, totalPages }) {
		return (
			<div class="App">
				<Paging page={page} totalPages={totalPages} onPage={this.handlePaging.bind(this)} />
				<Tracks tracks={tracks.slice(0, this.state.perPage)} page={page} />
			</div>
		);
	}
}

export default App;
