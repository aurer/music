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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJdLCJuYW1lcyI6WyJoIiwiQ29tcG9uZW50IiwicHJlYWN0IiwiVHJhY2siLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTTtBQUFFQSxFQUFBQSxDQUFGO0FBQUtDLEVBQUFBO0FBQUwsSUFBbUJDLE1BQXpCOztBQUVBLE1BQU1DLEtBQU4sU0FBb0JGLFNBQXBCLENBQThCO0FBQzdCRyxFQUFBQSxNQUFNLENBQUNDLEtBQUQsRUFBUTtBQUNiLFdBQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE1BREQsRUFFQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsT0FDQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsTUFERCxFQUVDO0FBQUssTUFBQSxLQUFLLEVBQUM7QUFBWCxNQUZELENBRkQsQ0FERDtBQVNBOztBQVg0Qjs7QUFjOUIsZUFBZUYsS0FBZiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgaCwgQ29tcG9uZW50IH0gPSBwcmVhY3Q7XHJcblxyXG5jbGFzcyBUcmFjayBleHRlbmRzIENvbXBvbmVudCB7XHJcblx0cmVuZGVyKHByb3BzKSB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2sgVHJhY2stLXBsYWNlaG9sZGVyXCI+XHJcblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWltYWdlXCIgLz5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2staW5mb1wiPlxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLXRpdGxlXCIgLz5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjay1hcnRpc3RcIiAvPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHQ8L2Rpdj5cclxuXHRcdCk7XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBUcmFjaztcclxuIl0sImZpbGUiOiJjb21wb25lbnRzL1RyYWNrUGxhY2Vob2xkZXIuanMifQ==