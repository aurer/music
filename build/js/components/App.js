const {
  h,
  Component
} = preact;
import Tracks from './Tracks.js';
import Paging from './Paging.js';
import Scrobbler from '../services/scrobbler.js';
const scrobbler = new Scrobbler('philmau', 'ccfce33b35f8480c2413f2a642fa2c6a');

class App extends Component {
  constructor() {
    super();
    this.state = {
      page: 1,
      total: 0,
      perPage: 10,
      totalPages: 0,
      tracks: Array.apply({}, Array(30))
    };
  }

  componentWillMount() {
    this.fetchTracks();
  }

  handlePaging(page) {
    this.setState({
      page: page,
      tracks: Array.apply({}, Array(this.state.perPage))
    }, this.fetchTracks);
  }

  fetchTracks() {
    scrobbler.getRecentTracks(this.state.perPage, this.state.page).then(data => {
      let attr = data.recenttracks['@attr'];
      this.setState({
        page: parseInt(attr.page),
        total: parseInt(attr.total),
        perPage: parseInt(attr.perPage),
        totalPages: parseInt(attr.totalPages),
        tracks: data.recenttracks.track
      });
    });
  }

  render(props, {
    tracks,
    page,
    total,
    perPage,
    totalPages
  }) {
    return h("div", {
      class: "App"
    }, h(Tracks, {
      tracks: tracks.slice(0, this.state.perPage),
      page: page
    }), h(Paging, {
      page: page,
      totalPages: totalPages,
      onPage: this.handlePaging.bind(this)
    }));
  }

}

export default App;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvQXBwLmpzIl0sIm5hbWVzIjpbImgiLCJDb21wb25lbnQiLCJwcmVhY3QiLCJUcmFja3MiLCJQYWdpbmciLCJTY3JvYmJsZXIiLCJzY3JvYmJsZXIiLCJBcHAiLCJjb25zdHJ1Y3RvciIsInN0YXRlIiwicGFnZSIsInRvdGFsIiwicGVyUGFnZSIsInRvdGFsUGFnZXMiLCJ0cmFja3MiLCJBcnJheSIsImFwcGx5IiwiY29tcG9uZW50V2lsbE1vdW50IiwiZmV0Y2hUcmFja3MiLCJoYW5kbGVQYWdpbmciLCJzZXRTdGF0ZSIsImdldFJlY2VudFRyYWNrcyIsInRoZW4iLCJkYXRhIiwiYXR0ciIsInJlY2VudHRyYWNrcyIsInBhcnNlSW50IiwidHJhY2siLCJyZW5kZXIiLCJwcm9wcyIsInNsaWNlIiwiYmluZCJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTTtBQUFFQSxFQUFBQSxDQUFGO0FBQUtDLEVBQUFBO0FBQUwsSUFBbUJDLE1BQXpCO0FBQ0EsT0FBT0MsTUFBUCxNQUFtQixhQUFuQjtBQUNBLE9BQU9DLE1BQVAsTUFBbUIsYUFBbkI7QUFDQSxPQUFPQyxTQUFQLE1BQXNCLDBCQUF0QjtBQUNBLE1BQU1DLFNBQVMsR0FBRyxJQUFJRCxTQUFKLENBQWMsU0FBZCxFQUF5QixrQ0FBekIsQ0FBbEI7O0FBRUEsTUFBTUUsR0FBTixTQUFrQk4sU0FBbEIsQ0FBNEI7QUFDM0JPLEVBQUFBLFdBQVcsR0FBRztBQUNiO0FBQ0EsU0FBS0MsS0FBTCxHQUFhO0FBQ1pDLE1BQUFBLElBQUksRUFBRSxDQURNO0FBRVpDLE1BQUFBLEtBQUssRUFBRSxDQUZLO0FBR1pDLE1BQUFBLE9BQU8sRUFBRSxFQUhHO0FBSVpDLE1BQUFBLFVBQVUsRUFBRSxDQUpBO0FBS1pDLE1BQUFBLE1BQU0sRUFBRUMsS0FBSyxDQUFDQyxLQUFOLENBQVksRUFBWixFQUFnQkQsS0FBSyxDQUFDLEVBQUQsQ0FBckI7QUFMSSxLQUFiO0FBT0E7O0FBRURFLEVBQUFBLGtCQUFrQixHQUFHO0FBQ3BCLFNBQUtDLFdBQUw7QUFDQTs7QUFFREMsRUFBQUEsWUFBWSxDQUFDVCxJQUFELEVBQU87QUFDbEIsU0FBS1UsUUFBTCxDQUNDO0FBQ0NWLE1BQUFBLElBQUksRUFBRUEsSUFEUDtBQUVDSSxNQUFBQSxNQUFNLEVBQUVDLEtBQUssQ0FBQ0MsS0FBTixDQUFZLEVBQVosRUFBZ0JELEtBQUssQ0FBQyxLQUFLTixLQUFMLENBQVdHLE9BQVosQ0FBckI7QUFGVCxLQURELEVBS0MsS0FBS00sV0FMTjtBQU9BOztBQUVEQSxFQUFBQSxXQUFXLEdBQUc7QUFDYlosSUFBQUEsU0FBUyxDQUFDZSxlQUFWLENBQTBCLEtBQUtaLEtBQUwsQ0FBV0csT0FBckMsRUFBOEMsS0FBS0gsS0FBTCxDQUFXQyxJQUF6RCxFQUErRFksSUFBL0QsQ0FBb0VDLElBQUksSUFBSTtBQUMzRSxVQUFJQyxJQUFJLEdBQUdELElBQUksQ0FBQ0UsWUFBTCxDQUFrQixPQUFsQixDQUFYO0FBQ0EsV0FBS0wsUUFBTCxDQUFjO0FBQ2JWLFFBQUFBLElBQUksRUFBRWdCLFFBQVEsQ0FBQ0YsSUFBSSxDQUFDZCxJQUFOLENBREQ7QUFFYkMsUUFBQUEsS0FBSyxFQUFFZSxRQUFRLENBQUNGLElBQUksQ0FBQ2IsS0FBTixDQUZGO0FBR2JDLFFBQUFBLE9BQU8sRUFBRWMsUUFBUSxDQUFDRixJQUFJLENBQUNaLE9BQU4sQ0FISjtBQUliQyxRQUFBQSxVQUFVLEVBQUVhLFFBQVEsQ0FBQ0YsSUFBSSxDQUFDWCxVQUFOLENBSlA7QUFLYkMsUUFBQUEsTUFBTSxFQUFFUyxJQUFJLENBQUNFLFlBQUwsQ0FBa0JFO0FBTGIsT0FBZDtBQU9BLEtBVEQ7QUFVQTs7QUFFREMsRUFBQUEsTUFBTSxDQUFDQyxLQUFELEVBQVE7QUFBRWYsSUFBQUEsTUFBRjtBQUFVSixJQUFBQSxJQUFWO0FBQWdCQyxJQUFBQSxLQUFoQjtBQUF1QkMsSUFBQUEsT0FBdkI7QUFBZ0NDLElBQUFBO0FBQWhDLEdBQVIsRUFBc0Q7QUFDM0QsV0FDQztBQUFLLE1BQUEsS0FBSyxFQUFDO0FBQVgsT0FDQyxFQUFDLE1BQUQ7QUFBUSxNQUFBLE1BQU0sRUFBRUMsTUFBTSxDQUFDZ0IsS0FBUCxDQUFhLENBQWIsRUFBZ0IsS0FBS3JCLEtBQUwsQ0FBV0csT0FBM0IsQ0FBaEI7QUFBcUQsTUFBQSxJQUFJLEVBQUVGO0FBQTNELE1BREQsRUFFQyxFQUFDLE1BQUQ7QUFBUSxNQUFBLElBQUksRUFBRUEsSUFBZDtBQUFvQixNQUFBLFVBQVUsRUFBRUcsVUFBaEM7QUFBNEMsTUFBQSxNQUFNLEVBQUUsS0FBS00sWUFBTCxDQUFrQlksSUFBbEIsQ0FBdUIsSUFBdkI7QUFBcEQsTUFGRCxDQUREO0FBTUE7O0FBOUMwQjs7QUFpRDVCLGVBQWV4QixHQUFmIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBoLCBDb21wb25lbnQgfSA9IHByZWFjdDtcbmltcG9ydCBUcmFja3MgZnJvbSAnLi9UcmFja3MuanMnO1xuaW1wb3J0IFBhZ2luZyBmcm9tICcuL1BhZ2luZy5qcyc7XG5pbXBvcnQgU2Nyb2JibGVyIGZyb20gJy4uL3NlcnZpY2VzL3Njcm9iYmxlci5qcyc7XG5jb25zdCBzY3JvYmJsZXIgPSBuZXcgU2Nyb2JibGVyKCdwaGlsbWF1JywgJ2NjZmNlMzNiMzVmODQ4MGMyNDEzZjJhNjQyZmEyYzZhJyk7XG5cbmNsYXNzIEFwcCBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5zdGF0ZSA9IHtcblx0XHRcdHBhZ2U6IDEsXG5cdFx0XHR0b3RhbDogMCxcblx0XHRcdHBlclBhZ2U6IDEwLFxuXHRcdFx0dG90YWxQYWdlczogMCxcblx0XHRcdHRyYWNrczogQXJyYXkuYXBwbHkoe30sIEFycmF5KDMwKSlcblx0XHR9O1xuXHR9XG5cblx0Y29tcG9uZW50V2lsbE1vdW50KCkge1xuXHRcdHRoaXMuZmV0Y2hUcmFja3MoKTtcblx0fVxuXG5cdGhhbmRsZVBhZ2luZyhwYWdlKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZShcblx0XHRcdHtcblx0XHRcdFx0cGFnZTogcGFnZSxcblx0XHRcdFx0dHJhY2tzOiBBcnJheS5hcHBseSh7fSwgQXJyYXkodGhpcy5zdGF0ZS5wZXJQYWdlKSlcblx0XHRcdH0sXG5cdFx0XHR0aGlzLmZldGNoVHJhY2tzXG5cdFx0KTtcblx0fVxuXG5cdGZldGNoVHJhY2tzKCkge1xuXHRcdHNjcm9iYmxlci5nZXRSZWNlbnRUcmFja3ModGhpcy5zdGF0ZS5wZXJQYWdlLCB0aGlzLnN0YXRlLnBhZ2UpLnRoZW4oZGF0YSA9PiB7XG5cdFx0XHRsZXQgYXR0ciA9IGRhdGEucmVjZW50dHJhY2tzWydAYXR0ciddO1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHBhZ2U6IHBhcnNlSW50KGF0dHIucGFnZSksXG5cdFx0XHRcdHRvdGFsOiBwYXJzZUludChhdHRyLnRvdGFsKSxcblx0XHRcdFx0cGVyUGFnZTogcGFyc2VJbnQoYXR0ci5wZXJQYWdlKSxcblx0XHRcdFx0dG90YWxQYWdlczogcGFyc2VJbnQoYXR0ci50b3RhbFBhZ2VzKSxcblx0XHRcdFx0dHJhY2tzOiBkYXRhLnJlY2VudHRyYWNrcy50cmFja1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZW5kZXIocHJvcHMsIHsgdHJhY2tzLCBwYWdlLCB0b3RhbCwgcGVyUGFnZSwgdG90YWxQYWdlcyB9KSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3M9XCJBcHBcIj5cblx0XHRcdFx0PFRyYWNrcyB0cmFja3M9e3RyYWNrcy5zbGljZSgwLCB0aGlzLnN0YXRlLnBlclBhZ2UpfSBwYWdlPXtwYWdlfSAvPlxuXHRcdFx0XHQ8UGFnaW5nIHBhZ2U9e3BhZ2V9IHRvdGFsUGFnZXM9e3RvdGFsUGFnZXN9IG9uUGFnZT17dGhpcy5oYW5kbGVQYWdpbmcuYmluZCh0aGlzKX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQXBwO1xuIl0sImZpbGUiOiJjb21wb25lbnRzL0FwcC5qcyJ9