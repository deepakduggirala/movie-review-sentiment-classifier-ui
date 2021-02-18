const axios = require('axios');
require('axios-debug-log')
const config = require('./config')()

const BASE_URL = config.inference_base_url

function get_review_sentiment_classification(reviewContent) {
  return axios.post(`${BASE_URL}/predict`, {
    review: reviewContent
  }).then(res => {
    if(res.status === 200) {
      return res.data
    } else {
      return {}
    }
  }).catch(err => {
    console.log(err)
    return {}
  })
}

module.exports = {
  get_review_sentiment_classification
}

// r1=`'The Little Things' is a diversion - not the worst way to kill two hours, and definitely a movie with some people in it. It's a shame there isn't more to recommend about it.
// - Jake Watt

// Read Jake's full article...
// https://www.maketheswitch.com.au/article/review-the-little-things-three-oscar-winners-one-so-so-mystery`

// r2=`Briskly paced and littered with jagged, realistic edges though it is, 'Greenland' ultimately imagines a very sentimental planetary extinction. Perhaps the highest compliment I can pay this film is that it's far better than the annual paint-by-numbers Gerard Butler movie that humanity is used to receiving.
// - Jake Watt

// Read Jake's full article...
// https://www.maketheswitch.com.au/article/review-greenland-a-gerard-butler-flick-that-isnt-a-disaster`

// reviews = [r1, r2]



// // get_review_sentiment_classification(r).then(console.log).catch(console.log);

// sequential_requests(reviews, get_review_sentiment_classification).then(console.log).catch(console.log)