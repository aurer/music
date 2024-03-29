import { h, Component } from '../lib/preact.js';
import { ArrowLeft, ArrowRight, Refresh } from './Icons.js';

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

  render({
    page,
    total,
    perPage,
    totalPages
  }) {
    return h("div", {
      class: "Paging"
    }, h("button", {
      class: "Button Paging-refresh",
      onClick: this.handleRefresh.bind(this),
      title: "Refresh"
    }, h(Refresh, null)), h("button", {
      title: "Newer",
      class: "Button Paging-prev",
      onClick: this.handlePrev.bind(this),
      disabled: !this.hasPrev()
    }, h(ArrowLeft, null)), h("button", {
      title: "Older",
      class: "Button Paging-next",
      onClick: this.handleNext.bind(this),
      disabled: !this.hasNext()
    }, h(ArrowRight, null)));
  }

}

export default Paging;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvUGFnaW5nLmpzIl0sIm5hbWVzIjpbImgiLCJDb21wb25lbnQiLCJBcnJvd0xlZnQiLCJBcnJvd1JpZ2h0IiwiUmVmcmVzaCIsIlBhZ2luZyIsImhhbmRsZVByZXYiLCJoYXNQcmV2IiwicHJvcHMiLCJvblBhZ2UiLCJwYWdlIiwiaGFuZGxlTmV4dCIsImhhc05leHQiLCJoYW5kbGVSZWZyZXNoIiwidG90YWxQYWdlcyIsInJlbmRlciIsInRvdGFsIiwicGVyUGFnZSIsImJpbmQiXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLENBQVQsRUFBWUMsU0FBWixRQUE2QixrQkFBN0I7QUFDQSxTQUFTQyxTQUFULEVBQW9CQyxVQUFwQixFQUFnQ0MsT0FBaEMsUUFBK0MsWUFBL0M7O0FBRUEsTUFBTUMsTUFBTixTQUFxQkosU0FBckIsQ0FBK0I7QUFDOUJLLEVBQUFBLFVBQVUsR0FBRztBQUNaLFFBQUksS0FBS0MsT0FBTCxFQUFKLEVBQW9CO0FBQ25CLFdBQUtDLEtBQUwsQ0FBV0MsTUFBWCxDQUFrQixLQUFLRCxLQUFMLENBQVdFLElBQVgsR0FBa0IsQ0FBcEM7QUFDQTtBQUNEOztBQUVEQyxFQUFBQSxVQUFVLEdBQUc7QUFDWixRQUFJLEtBQUtDLE9BQUwsRUFBSixFQUFvQjtBQUNuQixXQUFLSixLQUFMLENBQVdDLE1BQVgsQ0FBa0IsS0FBS0QsS0FBTCxDQUFXRSxJQUFYLEdBQWtCLENBQXBDO0FBQ0E7QUFDRDs7QUFFREcsRUFBQUEsYUFBYSxHQUFHO0FBQ2YsUUFBSSxLQUFLRCxPQUFMLEVBQUosRUFBb0I7QUFDbkIsV0FBS0osS0FBTCxDQUFXQyxNQUFYLENBQWtCLEtBQUtELEtBQUwsQ0FBV0UsSUFBN0I7QUFDQTtBQUNEOztBQUVESCxFQUFBQSxPQUFPLEdBQUc7QUFDVCxXQUFPLEtBQUtDLEtBQUwsQ0FBV0UsSUFBWCxHQUFrQixDQUF6QjtBQUNBOztBQUVERSxFQUFBQSxPQUFPLEdBQUc7QUFDVCxXQUFPLEtBQUtKLEtBQUwsQ0FBV0UsSUFBWCxJQUFtQixLQUFLRixLQUFMLENBQVdNLFVBQXJDO0FBQ0E7O0FBRURDLEVBQUFBLE1BQU0sQ0FBQztBQUFFTCxJQUFBQSxJQUFGO0FBQVFNLElBQUFBLEtBQVI7QUFBZUMsSUFBQUEsT0FBZjtBQUF3QkgsSUFBQUE7QUFBeEIsR0FBRCxFQUF1QztBQUM1QyxXQUNDO0FBQUssTUFBQSxLQUFLLEVBQUM7QUFBWCxPQUVDO0FBQVEsTUFBQSxLQUFLLEVBQUMsdUJBQWQ7QUFBc0MsTUFBQSxPQUFPLEVBQUUsS0FBS0QsYUFBTCxDQUFtQkssSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBL0M7QUFBOEUsTUFBQSxLQUFLLEVBQUM7QUFBcEYsT0FDQyxFQUFDLE9BQUQsT0FERCxDQUZELEVBS0M7QUFDQyxNQUFBLEtBQUssRUFBQyxPQURQO0FBRUMsTUFBQSxLQUFLLEVBQUMsb0JBRlA7QUFHQyxNQUFBLE9BQU8sRUFBRSxLQUFLWixVQUFMLENBQWdCWSxJQUFoQixDQUFxQixJQUFyQixDQUhWO0FBSUMsTUFBQSxRQUFRLEVBQUUsQ0FBQyxLQUFLWCxPQUFMO0FBSlosT0FNQyxFQUFDLFNBQUQsT0FORCxDQUxELEVBYUM7QUFDQyxNQUFBLEtBQUssRUFBQyxPQURQO0FBRUMsTUFBQSxLQUFLLEVBQUMsb0JBRlA7QUFHQyxNQUFBLE9BQU8sRUFBRSxLQUFLSSxVQUFMLENBQWdCTyxJQUFoQixDQUFxQixJQUFyQixDQUhWO0FBSUMsTUFBQSxRQUFRLEVBQUUsQ0FBQyxLQUFLTixPQUFMO0FBSlosT0FNQyxFQUFDLFVBQUQsT0FORCxDQWJELENBREQ7QUF3QkE7O0FBcEQ2Qjs7QUF1RC9CLGVBQWVQLE1BQWYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBoLCBDb21wb25lbnR9ICBmcm9tICcuLi9saWIvcHJlYWN0LmpzJztcbmltcG9ydCB7IEFycm93TGVmdCwgQXJyb3dSaWdodCwgUmVmcmVzaCB9IGZyb20gJy4vSWNvbnMuanMnO1xuXG5jbGFzcyBQYWdpbmcgZXh0ZW5kcyBDb21wb25lbnQge1xuXHRoYW5kbGVQcmV2KCkge1xuXHRcdGlmICh0aGlzLmhhc1ByZXYoKSkge1xuXHRcdFx0dGhpcy5wcm9wcy5vblBhZ2UodGhpcy5wcm9wcy5wYWdlIC0gMSk7XG5cdFx0fVxuXHR9XG5cblx0aGFuZGxlTmV4dCgpIHtcblx0XHRpZiAodGhpcy5oYXNOZXh0KCkpIHtcblx0XHRcdHRoaXMucHJvcHMub25QYWdlKHRoaXMucHJvcHMucGFnZSArIDEpO1xuXHRcdH1cblx0fVxuXG5cdGhhbmRsZVJlZnJlc2goKSB7XG5cdFx0aWYgKHRoaXMuaGFzTmV4dCgpKSB7XG5cdFx0XHR0aGlzLnByb3BzLm9uUGFnZSh0aGlzLnByb3BzLnBhZ2UpO1xuXHRcdH1cblx0fVxuXG5cdGhhc1ByZXYoKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMucGFnZSA+IDE7XG5cdH1cblxuXHRoYXNOZXh0KCkge1xuXHRcdHJldHVybiB0aGlzLnByb3BzLnBhZ2UgPD0gdGhpcy5wcm9wcy50b3RhbFBhZ2VzO1xuXHR9XG5cblx0cmVuZGVyKHsgcGFnZSwgdG90YWwsIHBlclBhZ2UsIHRvdGFsUGFnZXMgfSkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiUGFnaW5nXCI+XG5cdFx0XHRcdHsvKiBQYWdlIHtwYWdlfSBvZiB7dG90YWxQYWdlc30gKi99XG5cdFx0XHRcdDxidXR0b24gY2xhc3M9XCJCdXR0b24gUGFnaW5nLXJlZnJlc2hcIiBvbkNsaWNrPXt0aGlzLmhhbmRsZVJlZnJlc2guYmluZCh0aGlzKX0gdGl0bGU9XCJSZWZyZXNoXCI+XG5cdFx0XHRcdFx0PFJlZnJlc2ggLz5cblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHR0aXRsZT1cIk5ld2VyXCJcblx0XHRcdFx0XHRjbGFzcz1cIkJ1dHRvbiBQYWdpbmctcHJldlwiXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5oYW5kbGVQcmV2LmJpbmQodGhpcyl9XG5cdFx0XHRcdFx0ZGlzYWJsZWQ9eyF0aGlzLmhhc1ByZXYoKX1cblx0XHRcdFx0PlxuXHRcdFx0XHRcdDxBcnJvd0xlZnQgLz5cblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHR0aXRsZT1cIk9sZGVyXCJcblx0XHRcdFx0XHRjbGFzcz1cIkJ1dHRvbiBQYWdpbmctbmV4dFwiXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5oYW5kbGVOZXh0LmJpbmQodGhpcyl9XG5cdFx0XHRcdFx0ZGlzYWJsZWQ9eyF0aGlzLmhhc05leHQoKX1cblx0XHRcdFx0PlxuXHRcdFx0XHRcdDxBcnJvd1JpZ2h0IC8+XG5cdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdpbmc7XG4iXSwiZmlsZSI6ImNvbXBvbmVudHMvUGFnaW5nLmpzIn0=