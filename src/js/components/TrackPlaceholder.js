const { h, Component } = preact;

class Track extends Component {
	render(props) {
		return (
			<div class="Track-container">
				<div class="Track Track--placeholder">
					{/* <div class="Track-image" /> */}
					<div class="Track-name" />
					<div class="Track-artist" />
				</div>
			</div>
		);
	}
}

export default Track;
