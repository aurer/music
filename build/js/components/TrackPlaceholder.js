const {
  h,
  Component
} = preact;

class Track extends Component {
  render(props) {
    return h("div", {
      class: "Track-container"
    }, h("div", {
      class: "Track Track--placeholder"
    }, h("div", {
      class: "Track-name"
    }), h("div", {
      class: "Track-artist"
    })));
  }

}

export default Track;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJdLCJuYW1lcyI6WyJoIiwiQ29tcG9uZW50IiwicHJlYWN0IiwiVHJhY2siLCJyZW5kZXIiLCJwcm9wcyJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTTtBQUFFQSxFQUFBQSxDQUFGO0FBQUtDLEVBQUFBO0FBQUwsSUFBbUJDLE1BQXpCOztBQUVBLE1BQU1DLEtBQU4sU0FBb0JGLFNBQXBCLENBQThCO0FBQzdCRyxFQUFBQSxNQUFNLENBQUNDLEtBQUQsRUFBUTtBQUNiLFdBQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BQ0M7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE9BRUM7QUFBSyxNQUFBLEtBQUssRUFBQztBQUFYLE1BRkQsRUFHQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsTUFIRCxDQURELENBREQ7QUFTQTs7QUFYNEI7O0FBYzlCLGVBQWVGLEtBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IGgsIENvbXBvbmVudCB9ID0gcHJlYWN0O1xuXG5jbGFzcyBUcmFjayBleHRlbmRzIENvbXBvbmVudCB7XG5cdHJlbmRlcihwcm9wcykge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiVHJhY2stY29udGFpbmVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjayBUcmFjay0tcGxhY2Vob2xkZXJcIj5cblx0XHRcdFx0XHR7LyogPGRpdiBjbGFzcz1cIlRyYWNrLWltYWdlXCIgLz4gKi99XG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cIlRyYWNrLW5hbWVcIiAvPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJUcmFjay1hcnRpc3RcIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVHJhY2s7XG4iXSwiZmlsZSI6ImNvbXBvbmVudHMvVHJhY2tQbGFjZWhvbGRlci5qcyJ9