const { h, Component } = preact;

class Track extends Component {
	render(props) {
		return (
			<div class="Track Track--placeholder">
				<div class="Track-name" />
				<div class="Track-artist" />
			</div>
		);
	}
}

export default Track;
