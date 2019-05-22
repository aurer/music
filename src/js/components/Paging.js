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
				<div class="Paging-info">
					{/* Page {page} of {totalPages} */}
					<button onClick={this.handleRefresh.bind(this)}>Refresh</button>
				</div>
				<div class="Paging-controls">
					<button class="Paging-prev" onClick={this.handlePrev.bind(this)} disabled={!this.hasPrev()}>prev</button>
					<button class="Paging-next" onClick={this.handleNext.bind(this)} disabled={!this.hasNext()}>next</button>
				</div>
			</div>
		);
	}
}

export default Paging;
