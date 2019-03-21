const { h, Component } = preact;

class Paging extends Component {
	handlePrev() {
		if (this.hasPrev()) {
			this.props.onPage(this.props.page - 1);
		}
	}

	handleNext() {
		if (this.hasNext()) {
			this.props.onPage(this.props.page + 1);
		}
	}

	hasPrev() {
		return this.props.page > 1;
	}

	hasNext() {
		return this.props.page <= this.props.totalPages;
	}

	render({ page, total, perPage, totalPages }) {
		return (
			<div class="Paging">
				<div class="Paging-info">
					Page {page} of {totalPages}
				</div>
				{this.hasPrev() && <button onClick={this.handlePrev.bind(this)}>prev</button>}
				{this.hasNext() && <button onClick={this.handleNext.bind(this)}>next</button>}
			</div>
		);
	}
}

export default Paging;
