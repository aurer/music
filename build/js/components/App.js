import { h, render, Component } from '../lib/preact.js';
import Tracks from './Tracks.js';
import Track from './Track.js';
import Paging from './Paging.js';
import Scrobbler from '../services/scrobbler.js';
const scrobbler = new Scrobbler('philmau', 'ccfce33b35f8480c2413f2a642fa2c6a');

class App extends Component {
  constructor() {
    super();
    this.state = {
      page: 1,
      total: 0,
      perPage: 20,
      totalPages: 0,
      tracks: Array.apply({}, Array(20)),
      playingTrack: null
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
        tracks: this.getPlayedTracks(data.recenttracks.track),
        playingTrack: this.getPlayingTrack(data.recenttracks.track)
      });
    });
  }

  getPlayedTracks(tracks) {
    return tracks.filter(t => {
      var _t$Attr;

      if ((_t$Attr = t['@attr']) !== null && _t$Attr !== void 0 && _t$Attr.nowplaying) {
        return false;
      }

      return true;
    });
  }

  getPlayingTrack(tracks) {
    return tracks.find(t => {
      var _t$Attr2;

      return (_t$Attr2 = t['@attr']) === null || _t$Attr2 === void 0 ? void 0 : _t$Attr2.nowplaying;
    });
  }

  render(props, {
    tracks,
    playingTrack,
    page,
    total,
    perPage,
    totalPages
  }) {
    return h("div", {
      class: "App"
    }, h("main", {
      class: "App-main"
    }, h(Tracks, {
      tracks: tracks.slice(0, this.state.perPage),
      page: page
    })), h("footer", null, h("div", {
      class: "App-nowPlaying"
    }, playingTrack && h(Track, {
      track: playingTrack
    })), h(Paging, {
      page: page,
      totalPages: totalPages,
      onPage: this.handlePaging.bind(this)
    })));
  }

}

export default App;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvQXBwLmpzIl0sIm5hbWVzIjpbImgiLCJyZW5kZXIiLCJDb21wb25lbnQiLCJUcmFja3MiLCJUcmFjayIsIlBhZ2luZyIsIlNjcm9iYmxlciIsInNjcm9iYmxlciIsIkFwcCIsImNvbnN0cnVjdG9yIiwic3RhdGUiLCJwYWdlIiwidG90YWwiLCJwZXJQYWdlIiwidG90YWxQYWdlcyIsInRyYWNrcyIsIkFycmF5IiwiYXBwbHkiLCJwbGF5aW5nVHJhY2siLCJjb21wb25lbnRXaWxsTW91bnQiLCJmZXRjaFRyYWNrcyIsImhhbmRsZVBhZ2luZyIsInNldFN0YXRlIiwiZ2V0UmVjZW50VHJhY2tzIiwidGhlbiIsImRhdGEiLCJhdHRyIiwicmVjZW50dHJhY2tzIiwicGFyc2VJbnQiLCJnZXRQbGF5ZWRUcmFja3MiLCJ0cmFjayIsImdldFBsYXlpbmdUcmFjayIsImZpbHRlciIsInQiLCJub3dwbGF5aW5nIiwiZmluZCIsInByb3BzIiwic2xpY2UiLCJiaW5kIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxDQUFULEVBQVlDLE1BQVosRUFBb0JDLFNBQXBCLFFBQXNDLGtCQUF0QztBQUNBLE9BQU9DLE1BQVAsTUFBbUIsYUFBbkI7QUFDQSxPQUFPQyxLQUFQLE1BQWtCLFlBQWxCO0FBQ0EsT0FBT0MsTUFBUCxNQUFtQixhQUFuQjtBQUNBLE9BQU9DLFNBQVAsTUFBc0IsMEJBQXRCO0FBQ0EsTUFBTUMsU0FBUyxHQUFHLElBQUlELFNBQUosQ0FBYyxTQUFkLEVBQXlCLGtDQUF6QixDQUFsQjs7QUFFQSxNQUFNRSxHQUFOLFNBQWtCTixTQUFsQixDQUE0QjtBQUMzQk8sRUFBQUEsV0FBVyxHQUFHO0FBQ2I7QUFDQSxTQUFLQyxLQUFMLEdBQWE7QUFDWkMsTUFBQUEsSUFBSSxFQUFFLENBRE07QUFFWkMsTUFBQUEsS0FBSyxFQUFFLENBRks7QUFHWkMsTUFBQUEsT0FBTyxFQUFFLEVBSEc7QUFJWkMsTUFBQUEsVUFBVSxFQUFFLENBSkE7QUFLWkMs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O0FBQVEsTUFBQSxJQUFJLEVBQUVQLElBQWQ7QUFBb0IsTUFBQSxVQUFVLEVBQUVHLFVBQWhDO0FBQTRDLE1BQUEsTUFBTSxFQUFFLEtBQUtPLFlBQUwsQ0FBa0JpQixJQUFsQixDQUF1QixJQUF2QjtBQUFwRCxNQUpELENBSkQsQ0FERDtBQWFBOztBQXBFMEI7O0FBdUU1QixlQUFlOUIsR0FBZiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGgsIHJlbmRlciwgQ29tcG9uZW50IH0gIGZyb20gJy4uL2xpYi9wcmVhY3QuanMnO1xuaW1wb3J0IFRyYWNrcyBmcm9tICcuL1RyYWNrcy5qcyc7XG5pbXBvcnQgVHJhY2sgZnJvbSAnLi9UcmFjay5qcyc7XG5pbXBvcnQgUGFnaW5nIGZyb20gJy4vUGFnaW5nLmpzJztcbmltcG9ydCBTY3JvYmJsZXIgZnJvbSAnLi4vc2VydmljZXMvc2Nyb2JibGVyLmpzJztcbmNvbnN0IHNjcm9iYmxlciA9IG5ldyBTY3JvYmJsZXIoJ3BoaWxtYXUnLCAnY2NmY2UzM2IzNWY4NDgwYzI0MTNmMmE2NDJmYTJjNmEnKTtcblxuY2xhc3MgQXBwIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLnN0YXRlID0ge1xuXHRcdFx0cGFnZTogMSxcblx0XHRcdHRvdGFsOiAwLFxuXHRcdFx0cGVyUGFnZTogMjAsXG5cdFx0XHR0b3RhbFBhZ2VzOiAwLFxuXHRcdFx0dHJhY2tzOiBBcnJheS5hcHBseSh7fSwgQXJyYXkoMjApKSxcblx0XHRcdHBsYXlpbmdUcmFjazogbnVsbFxuXHRcdH07XG5cdH1cblxuXHRjb21wb25lbnRXaWxsTW91bnQoKSB7XG5cdFx0dGhpcy5mZXRjaFRyYWNrcygpO1xuXHR9XG5cblx0aGFuZGxlUGFnaW5nKHBhZ2UpIHtcblx0XHR0aGlzLnNldFN0YXRlKFxuXHRcdFx0e1xuXHRcdFx0XHRwYWdlOiBwYWdlLFxuXHRcdFx0XHR0cmFja3M6IEFycmF5LmFwcGx5KHt9LCBBcnJheSh0aGlzLnN0YXRlLnBlclBhZ2UpKVxuXHRcdFx0fSxcblx0XHRcdHRoaXMuZmV0Y2hUcmFja3Ncblx0XHQpO1xuXHR9XG5cblx0ZmV0Y2hUcmFja3MoKSB7XG5cdFx0c2Nyb2JibGVyLmdldFJlY2VudFRyYWNrcyh0aGlzLnN0YXRlLnBlclBhZ2UsIHRoaXMuc3RhdGUucGFnZSkudGhlbihkYXRhID0+IHtcblx0XHRcdGxldCBhdHRyID0gZGF0YS5yZWNlbnR0cmFja3NbJ0BhdHRyJ107XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0cGFnZTogcGFyc2VJbnQoYXR0ci5wYWdlKSxcblx0XHRcdFx0dG90YWw6IHBhcnNlSW50KGF0dHIudG90YWwpLFxuXHRcdFx0XHRwZXJQYWdlOiBwYXJzZUludChhdHRyLnBlclBhZ2UpLFxuXHRcdFx0XHR0b3RhbFBhZ2VzOiBwYXJzZUludChhdHRyLnRvdGFsUGFnZXMpLFxuXHRcdFx0XHR0cmFja3M6IHRoaXMuZ2V0UGxheWVkVHJhY2tzKGRhdGEucmVjZW50dHJhY2tzLnRyYWNrKSxcblx0XHRcdFx0cGxheWluZ1RyYWNrOiB0aGlzLmdldFBsYXlpbmdUcmFjayhkYXRhLnJlY2VudHRyYWNrcy50cmFjaylcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0Z2V0UGxheWVkVHJhY2tzKHRyYWNrcykge1xuXHRcdHJldHVybiB0cmFja3MuZmlsdGVyKHQgPT4ge1xuXHRcdFx0aWYgKHRbJ0BhdHRyJ10/Lm5vd3BsYXlpbmcpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH0pXG5cdH1cblxuXHRnZXRQbGF5aW5nVHJhY2sodHJhY2tzKSB7XG5cdFx0cmV0dXJuIHRyYWNrcy5maW5kKHQgPT4gdFsnQGF0dHInXT8ubm93cGxheWluZylcblx0fVxuXG5cdHJlbmRlcihwcm9wcywgeyB0cmFja3MsIHBsYXlpbmdUcmFjaywgcGFnZSwgdG90YWwsIHBlclBhZ2UsIHRvdGFsUGFnZXMgfSkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiQXBwXCI+XG5cdFx0XHRcdDxtYWluIGNsYXNzPVwiQXBwLW1haW5cIj5cblx0XHRcdFx0XHQ8VHJhY2tzIHRyYWNrcz17dHJhY2tzLnNsaWNlKDAsIHRoaXMuc3RhdGUucGVyUGFnZSl9IHBhZ2U9e3BhZ2V9IC8+XG5cdFx0XHRcdDwvbWFpbj5cblx0XHRcdFx0PGZvb3Rlcj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwiQXBwLW5vd1BsYXlpbmdcIj5cblx0XHRcdFx0XHRcdHtwbGF5aW5nVHJhY2sgJiYgPFRyYWNrIHRyYWNrPXtwbGF5aW5nVHJhY2t9IC8+fVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxQYWdpbmcgcGFnZT17cGFnZX0gdG90YWxQYWdlcz17dG90YWxQYWdlc30gb25QYWdlPXt0aGlzLmhhbmRsZVBhZ2luZy5iaW5kKHRoaXMpfSAvPlxuXHRcdFx0XHQ8L2Zvb3Rlcj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQXBwO1xuIl0sImZpbGUiOiJjb21wb25lbnRzL0FwcC5qcyJ9