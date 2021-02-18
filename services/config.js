const fs = require('fs')
const process = require('process')

function config() {
  return {
    tndb_base_url: 'https://api.themoviedb.org/3',
    tmdb_api_key: process.env.TMDB_API_KEY,
    inference_base_url: process.env.INFERENCE_API,
    inference_api_key: ''
  }
}

module.exports = config