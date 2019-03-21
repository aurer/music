const {
  h,
  Component
} = preact;

class Track extends Component {
  render(props) {
    return h("div", {
      class: "Track Track--placeholder"
    }, h("div", {
      class: "Track-name"
    }), h("div", {
      class: "Track-artist"
    }));
  }

}

export default Track;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJdLCJuYW1lcyI6WyJoIiwiQ29tcG9uZW50IiwicHJlYWN0IiwiVHJhY2siLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTTtBQUFFQSxFQUFBQSxDQUFGO0FBQUtDLEVBQUFBO0FBQUwsSUFBbUJDLE1BQXpCOztBQUVBLE1BQU1DLEtBQU4sU0FBb0JGLFNBQXBCLENBQThCO0FBQzdCRyxFQUFBQSxNQUFNLENBQUNDLEtBQUQsRUFBUTtBQUNiLFdBQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE1BREQsRUFFQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsTUFGRCxDQUREO0FBTUE7O0FBUjRCOztBQVc5QixlQUFlRixLQUFmIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBoLCBDb21wb25lbnQgfSA9IHByZWFjdDtcclxuXHJcbmNsYXNzIFRyYWNrIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHRyZW5kZXIocHJvcHMpIHtcclxuXHRcdHJldHVybiAoXHJcblx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjayBUcmFjay0tcGxhY2Vob2xkZXJcIj5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2stbmFtZVwiIC8+XHJcblx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLWFydGlzdFwiIC8+XHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFRyYWNrO1xyXG4iXSwiZmlsZSI6ImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJ9