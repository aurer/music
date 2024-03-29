const endpoint = 'https://ws.audioscrobbler.com/2.0/';

function makeParams(object) {
  let params = [];

  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      params.push(`${key}=${object[key]}`);
    }
  }

  return params.join('&');
}

class Scrobbler {
  constructor(user, api_key) {
    this.user = user;
    this.api_key = api_key;
    return this;
  }

  getRecentTracks(limit, page) {
    return this.fetch({
      method: 'user.getrecenttracks',
      limit: limit,
      page: page
    });
  }

  fetch(params) {
    let defaultParams = {
      user: this.user,
      api_key: this.api_key,
      format: 'json',
      limit: 10,
      page: 1
    };
    let queryString = makeParams(Object.assign(defaultParams, params));
    let url = `${endpoint}?${queryString}`;
    return fetch(url).then(res => res.json());
  }

}

export default Scrobbler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2VzL3Njcm9iYmxlci5qcyJdLCJuYW1lcyI6WyJlbmRwb2ludCIsIm1ha2VQYXJhbXMiLCJvYmplY3QiLCJwYXJhbXMiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInB1c2giLCJqb2luIiwiU2Nyb2JibGVyIiwiY29uc3RydWN0b3IiLCJ1c2VyIiwiYXBpX2tleSIsImdldFJlY2VudFRyYWNrcyIsImxpbWl0IiwicGFnZSIsImZldGNoIiwibWV0aG9kIiwiZGVmYXVsdFBhcmFtcyIsImZvcm1hdCIsInF1ZXJ5U3RyaW5nIiwiT2JqZWN0IiwiYXNzaWduIiwidXJsIiwidGhlbiIsInJlcyIsImpzb24iXSwibWFwcGluZ3MiOiJBQUFBLE1BQU1BLFFBQVEsR0FBRyxvQ0FBakI7O0FBRUEsU0FBU0MsVUFBVCxDQUFvQkMsTUFBcEIsRUFBNEI7QUFDM0IsTUFBSUMsTUFBTSxHQUFHLEVBQWI7O0FBQ0EsT0FBSyxNQUFNQyxHQUFYLElBQWtCRixNQUFsQixFQUEwQjtBQUN6QixRQUFJQSxNQUFNLENBQUNHLGNBQVAsQ0FBc0JELEdBQXRCLENBQUosRUFBZ0M7QUFDL0JELE1BQUFBLE1BQU0sQ0FBQ0csSUFBUCxDQUFhLEdBQUVGLEdBQUksSUFBR0YsTUFBTSxDQUFDRSxHQUFELENBQU0sRUFBbEM7QUFDQTtBQUNEOztBQUNELFNBQU9ELE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLEdBQVosQ0FBUDtBQUNBOztBQUVELE1BQU1DLFNBQU4sQ0FBZ0I7QUFDZkMsRUFBQUEsV0FBVyxDQUFDQyxJQUFELEVBQU9DLE9BQVAsRUFBZ0I7QUFDMUIsU0FBS0QsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsV0FBTyxJQUFQO0FBQ0E7O0FBRURDLEVBQUFBLGVBQWUsQ0FBQ0MsS0FBRCxFQUFRQyxJQUFSLEVBQWM7QUFDNUIsV0FBTyxLQUFLQyxLQUFMLENBQVc7QUFDakJDLE1BQUFBLE1BQU0sRUFBRSxzQkFEUztBQUVqQkgsTUFBQUEsS0FBSyxFQUFFQSxLQUZVO0FBR2pCQyxNQUFBQSxJQUFJLEVBQUVBO0FBSFcsS0FBWCxDQUFQO0FBS0E7O0FBRURDLEVBQUFBLEtBQUssQ0FBQ1osTUFBRCxFQUFTO0FBQ2IsUUFBSWMsYUFBYSxHQUFHO0FBQ25CUCxNQUFBQSxJQUFJLEVBQUUsS0FBS0EsSUFEUTtBQUVuQkMsTUFBQUEsT0FBTyxFQUFFLEtBQUtBLE9BRks7QUFHbkJPLE1BQUFBLE1BQU0sRUFBRSxNQUhXO0FBSW5CTCxNQUFBQSxLQUFLLEVBQUUsRUFKWTtBQUtuQkMsTUFBQUEsSUFBSSxFQUFFO0FBTGEsS0FBcEI7QUFPQSxRQUFJSyxXQUFXLEdBQUdsQixVQUFVLENBQUNtQixNQUFNLENBQUNDLE1BQVAsQ0FBY0osYUFBZCxFQUE2QmQsTUFBN0IsQ0FBRCxDQUE1QjtBQUNBLFFBQUltQixHQUFHLEdBQUksR0FBRXRCLFFBQVMsSUFBR21CLFdBQVksRUFBckM7QUFFQSxXQUFPSixLQUFLLENBQUNPLEdBQUQsQ0FBTCxDQUFXQyxJQUFYLENBQWdCQyxHQUFHLElBQUlBLEdBQUcsQ0FBQ0MsSUFBSixFQUF2QixDQUFQO0FBQ0E7O0FBM0JjOztBQThCaEIsZUFBZWpCLFNBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBlbmRwb2ludCA9ICdodHRwczovL3dzLmF1ZGlvc2Nyb2JibGVyLmNvbS8yLjAvJztcblxuZnVuY3Rpb24gbWFrZVBhcmFtcyhvYmplY3QpIHtcblx0bGV0IHBhcmFtcyA9IFtdO1xuXHRmb3IgKGNvbnN0IGtleSBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdHBhcmFtcy5wdXNoKGAke2tleX09JHtvYmplY3Rba2V5XX1gKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHBhcmFtcy5qb2luKCcmJyk7XG59XG5cbmNsYXNzIFNjcm9iYmxlciB7XG5cdGNvbnN0cnVjdG9yKHVzZXIsIGFwaV9rZXkpIHtcblx0XHR0aGlzLnVzZXIgPSB1c2VyO1xuXHRcdHRoaXMuYXBpX2tleSA9IGFwaV9rZXk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRnZXRSZWNlbnRUcmFja3MobGltaXQsIHBhZ2UpIHtcblx0XHRyZXR1cm4gdGhpcy5mZXRjaCh7XG5cdFx0XHRtZXRob2Q6ICd1c2VyLmdldHJlY2VudHRyYWNrcycsXG5cdFx0XHRsaW1pdDogbGltaXQsXG5cdFx0XHRwYWdlOiBwYWdlXG5cdFx0fSlcblx0fVxuXG5cdGZldGNoKHBhcmFtcykge1xuXHRcdGxldCBkZWZhdWx0UGFyYW1zID0ge1xuXHRcdFx0dXNlcjogdGhpcy51c2VyLFxuXHRcdFx0YXBpX2tleTogdGhpcy5hcGlfa2V5LFxuXHRcdFx0Zm9ybWF0OiAnanNvbicsXG5cdFx0XHRsaW1pdDogMTAsXG5cdFx0XHRwYWdlOiAxXG5cdFx0fTtcblx0XHRsZXQgcXVlcnlTdHJpbmcgPSBtYWtlUGFyYW1zKE9iamVjdC5hc3NpZ24oZGVmYXVsdFBhcmFtcywgcGFyYW1zKSk7XG5cdFx0bGV0IHVybCA9IGAke2VuZHBvaW50fT8ke3F1ZXJ5U3RyaW5nfWA7XG5cblx0XHRyZXR1cm4gZmV0Y2godXJsKS50aGVuKHJlcyA9PiByZXMuanNvbigpKTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBTY3JvYmJsZXI7XG4iXSwiZmlsZSI6InNlcnZpY2VzL3Njcm9iYmxlci5qcyJ9