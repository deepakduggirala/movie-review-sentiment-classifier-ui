const axios = require('axios');
require('axios-debug-log')
const config = require('./config')()

const BASE_URL = config.tndb_base_url //'https://api.themoviedb.org/3'
const API_KEY = config.tmdb_api_key //''

function filter_tv_movie(data) {
  return data.filter(item => ['tv', 'movie'].includes(item.media_type))
}

function randRange(a,b){
  var min_num = Math.min(a,b);
  var max_num = Math.max(a,b);
  var scale = max_num - min_num;
  var offset = min_num;
  return offset + Math.random()*scale;
}

function randInt(a,b){
  // returns an int in [a,b), left inclusive, right exclusive
  return Math.floor(randRange(a,b));
}

function random_shuffle(xs) {
  n = xs.length
  for(i=0; i<n;i++) {
    j = randInt(i, n)
    tmp = xs[j]
    xs[j] = xs[i]
    xs[i] = tmp
  }
  return xs
}

function getTrending(trendingPage, type) {
  type = type || 'all'
  return axios.get(BASE_URL + `/trending/${type}/week`, {
    params: {
      api_key: API_KEY,
      page: trendingPage
    }
  }).then(function(response) {
    if(response.status == 200) {
      return filter_tv_movie(response.data.results)
    } else {
      return []
    }
  }).catch(function(error) {
    console.log(error);
    return [];
  })
}

function getReviews(media_type, id, page) {
  page = page || 1
  return axios.get(BASE_URL + `/${media_type}/${id}/reviews`, {
    params: {
      api_key: API_KEY,
      page: page
    }
  }).then(function(response) {
    if(response.status == 200) {
      // console.log(response.data.results)
      return response.data.results;
    } else {
      return []
    }
  }).catch(function(error) {
    console.log(error);
    return [];
  })
}

// getTrending()
// getReviews('tv', 85271)
//   .then(data => {console.log(data)})
//   .catch(error => {console.log(error)});


function getReviewCardData(item, review) {
  return {
    media_type: item.media_type || 'tv',
    id: item.id,
    title: item.title || item.name,
    content: review.content,
    posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
    mediaUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
    reviewUrl: review.url,
    author:  review.author
  }
}

function getTrendingReviews(maxReviewsPerMedia, trendingPage) {
  trendingPage = trendingPage || randInt(1,11)
  maxReviewsPerMedia = maxReviewsPerMedia || 1
  return getTrending(trendingPage)
    .then(mediaItems => {
      return Promise.allSettled(mediaItems.map(item => {
        return getReviews(item.media_type, item.id)
          .then(reviews => {
            shuffled_review = random_shuffle(reviews)
            return shuffled_review
              .slice(0, maxReviewsPerMedia)
              .map(review => getReviewCardData(item, review))
          })
      }));
    })
    .then(results => {
      return random_shuffle(results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat()
        )
    })
}

function getTrendingMultiplePages(num_items_required, media_type) {
  num_items_required = num_items_required || 20
  num_pages_to_fetch = Math.ceil(num_items_required/20)
  pages = Array.from({length:num_pages_to_fetch}, (x,i)=>i+1)
  return Promise.allSettled(pages.map(p => getTrending(p, media_type)))
    .then(results => {
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat()
        .map(item => {
          return Object.assign(item,  {
            title: item.title || item.name,
            posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            mediaUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
            ratingScore: Math.round(item.vote_average*10)
          })
        })
    })
}

// getTrendingMultiplePages(30).then(console.log).catch(console.log)

function getAllReviews(media_type, id) {
  all_reviews = []
  return axios.get(BASE_URL + `/${media_type}/${id}/reviews`, {
    params: {
      api_key: API_KEY
    }
  }).then(res => {
    if(res.status === 200) {
      total_pages = res.data.total_pages
      pages = Array.from({length:total_pages}, (x,i)=>i+1)
      return Promise.allSettled(pages.map(p => getReviews(media_type, id, p)))
        .then(results => {
          return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .flat()
        })
    } else {
      return Promise.reject()
    }
  }).catch(err => {
    console.log(err.message)
    return []
  })
}

function getItem(media_type, id) {
  return axios.get(BASE_URL + `/${media_type}/${id}`, {
    params: {
      api_key: API_KEY
    }
  }).then(res => {
    let item = res.data
    return Object.assign(item, {
      title: item.title || item.name,
      posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      mediaUrl: `https://www.themoviedb.org/${media_type}/${id}`,
      ratingScore: Math.round(item.vote_average*10),
      // releaseYear: item.media_type === 'movie' ? item.release_date.slice(0, 4) : item.last_air_date.slice(0, 4)
    })
  })
}

// getAllReviews('tv', 1402).then(console.log).catch(console.log)

module.exports = {
  getItem,
  getAllReviews,
  getTrendingReviews,
  getTrendingMultiplePages
}
