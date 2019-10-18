import { h, Component }  from '../lib/preact.js';
import Track from './Track.js';
import TrackPlaceholder from './TrackPlaceholder.js';

class Tracks extends Component {
	render({ tracks }) {
		return <div class="Tracks">{tracks.map(track => (track ? <Track track={track} /> : <TrackPlaceholder />))}</div>;
	}
}

export default Tracks;
