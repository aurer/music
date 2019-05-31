const {
  h,
  Component
} = preact;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJdLCJuYW1lcyI6WyJoIiwiQ29tcG9uZW50IiwicHJlYWN0IiwiVHJhY2siLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTTtBQUFFQSxFQUFBQSxDQUFGO0FBQUtDLEVBQUFBO0FBQUwsSUFBbUJDLE1BQXpCOztBQUVBLE1BQU1DLEtBQU4sU0FBb0JGLFNBQXBCLENBQThCO0FBQzdCRyxFQUFBQSxNQUFNLENBQUNDLEtBQUQsRUFBUTtBQUNiLFdBQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE1BREQsRUFFQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsT0FDQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsTUFERCxFQUVDO0FBQUssTUFBQSxLQUFLLEVBQUM7QUFBWCxNQUZELENBRkQsQ0FERDtBQVNBOztBQVg0Qjs7QUFjOUIsZUFBZUYsS0FBZiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgaCwgQ29tcG9uZW50IH0gPSBwcmVhY3Q7XG5cbmNsYXNzIFRyYWNrIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0cmVuZGVyKHByb3BzKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjayBUcmFjay0tcGxhY2Vob2xkZXJcIj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWltYWdlXCIgLz5cblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWluZm9cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2stdGl0bGVcIiAvPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjay1hcnRpc3RcIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVHJhY2s7XG4iXSwiZmlsZSI6ImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJ9