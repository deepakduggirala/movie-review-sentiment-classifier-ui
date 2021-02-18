const express = require('express');
var exphbs = require('express-handlebars');
const path = require('path');
const tmdbService = require('./services/tmdbService');
const inferenceService = require('./services/inferenceService');
var favicon = require('serve-favicon')
var compression = require('compression')
const PORT = process.env.PORT || 5000

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(compression())
app.use(favicon(path.join(__dirname, 'dist', 'favicon.ico')))
app.use(express.static(path.join(__dirname, 'dist')))

async function embellishWithPrediction(r) {
  prediction = await inferenceService.get_review_sentiment_classification(r.content)
  if(prediction && prediction.class) {
    return Object.assign(r, {
      reviewClf: prediction.class,
      reviewConfidence:  Math.round(100*prediction.proba[prediction.class]) , 
      isPositive: prediction.class === 'positive'
    })
  }
}

const sequential_requests = async (iterable, action) => {
  results = []
  for (const x of iterable) {
    res = await action(x)
    results.push(res)
  }
  return results
}

function parallel_requests(reviews) {
  return Promise.allSettled(reviews.map(embellishWithPrediction))
    .then(results => {
      return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
    });
}

app.get('/reviews/trending', (req, res) => {
  tmdbService.getTrendingReviews(3)
  // .then(reviews => {
  //   return sequential_requests(reviews, embellishWithPrediction)
  // })
  .then(parallel_requests)
  .then(reviews => {
    console.log(reviews.length)
    res.render('trending-reviews', {
      reviews: reviews
        .map(r => {
          return Object.assign(r, {content: r.content.replace(/\r\n/g, '<br>')})
        })
    });
  }).catch(error=> {
    console.log(error.message)
    res.status(500).send();
  })
})

app.get('/about', (req, res) => {
  res.render('about');
})

app.get('/', (req, res) => {
  inferenceService.get_review_sentiment_classification("Good")
  tmdbService.getTrendingMultiplePages(200)
    .then(items => {
      console.log(items.length)
      res.render('trending', {
        items
      })
    })
})

app.get('/reviews/:media_type/:id', (req, res) => {
  media_type = req.params.media_type
  id = req.params.id

  tmdbService.getItem(media_type, id)
    .then(itemData => {
      tmdbService.getAllReviews(media_type, id)
        .then(parallel_requests)
        .then(reviews => {
          let payload = Object.assign(itemData, {
            reviews: reviews
              .map(r => {
                return Object.assign(r, {content: r.content.replace(/\r\n/g, '<br>')})
              })
          })
          
          payload.isFresh = payload.ratingScore > 75

          payload.numReviews = payload.reviews.length
          
          numPositiveReviews = payload.reviews.filter(r => r.isPositive).length
          
          payload.posReviewPercentage =  payload.numReviews !== 0 ? Math.round(100*numPositiveReviews/payload.numReviews) : 0
          
          // console.log(payload)

          res.render('item-reviews', payload)
        })
    }).catch(error=> {
      console.log(error.message)
      res.status(500).send();
    })
})

const server = app.listen(PORT, () => {
  console.log(`The application started on port ${server.address().port}`);
});