import { h, Component } from '../lib/preact.js';

class Track extends Component {
  render(props) {
    return h("div", {
      class: "Track Track--placeholder"
    }, h("div", {
      class: "Track-image"
    }), h("div", {
      class: "Track-info"
    }, h("div", {
      class: "Track-title"
    }), h("div", {
      class: "Track-artist"
    })));
  }

}

export default Track;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJdLCJuYW1lcyI6WyJoIiwiQ29tcG9uZW50IiwiVHJhY2siLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsQ0FBVCxFQUFZQyxTQUFaLFFBQThCLGtCQUE5Qjs7QUFFQSxNQUFNQyxLQUFOLFNBQW9CRCxTQUFwQixDQUE4QjtBQUM3QkUsRUFBQUEsTUFBTSxDQUFDQyxLQUFELEVBQVE7QUFDYixXQUNDO0FBQUssTUFBQSxLQUFLLEVBQUM7QUFBWCxPQUNDO0FBQUssTUFBQSxLQUFLLEVBQUM7QUFBWCxNQURELEVBRUM7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE1BREQsRUFFQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsTUFGRCxDQUZELENBREQ7QUFTQTs7QUFYNEI7O0FBYzlCLGVBQWVGLEtBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBoLCBDb21wb25lbnQgfSAgZnJvbSAnLi4vbGliL3ByZWFjdC5qcyc7XG5cbmNsYXNzIFRyYWNrIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0cmVuZGVyKHByb3BzKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjayBUcmFjay0tcGxhY2Vob2xkZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWltYWdlXCIgLz5cblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWluZm9cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2stdGl0bGVcIiAvPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjay1hcnRpc3RcIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVHJhY2s7XG4iXSwiZmlsZSI6ImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJ9