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

	handleRefresh() {
		if (this.hasNext()) {
			this.props.onPage(this.props.page);
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
				{/* Page {page} of {totalPages} */}
				<button class="Button" onClick={this.handleRefresh.bind(this)}>Refresh</button>
				<button class="Button Paging-prev" onClick={this.handlePrev.bind(this)} disabled={!this.hasPrev()}>prev</button>
				<button class="Button Paging-next" onClick={this.handleNext.bind(this)} disabled={!this.hasNext()}>next</button>
			</div>
		);
	}
}

export default Paging;
