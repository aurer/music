const { h, Component } = preact;

class Track extends Component {
	render(props) {
		return (
			<div class="Track Track--placeholder">
				<div class="Track-image" />
				<div class="Track-info">
					<div class="Track-title" />
					<div class="Track-artist" />
				</div>
			</div>
		);
	}
}

export default Track;
