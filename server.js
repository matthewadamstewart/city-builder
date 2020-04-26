'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
app.use(cors());


const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const dbClient = new pg.Client(DATABASE_URL);


const PORT = process.env.PORT || 3000;

function Location (city, obj) {
  this.search_query = city;
  this.formated_query = obj.display_name;
  this.lattitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(date, weatherDescription) {
  this.time = new Date(date).toDateString();
  this.forecast = weatherDescription;
}

function Trail(item) {
  this.name = item.name;
  this.location = item.location;
  this.length = item.length;
  this.stars = item.stars;
  this.star_votes = item.starVotes;
  this.summary = item.summary;
  this.trail_url = item.url;
  this.conditions = item.conditionDetails;
  this.condition_date = item.conditionDate.slice(0, 10);
  this.condition_time = item.conditionDate.slice(11, 19);
}

function Business(item) {
  this.name = item.name;
  this.image_url = item.image_url;
  this.price = item.price;
  this.rating = item.rating;
  this.url = item.url;
}

function errorHandler(error, request, response) {
  response.status(500).send('something went wrong: ' + error);
}

function declaredLocationResponse(locationResponse, response, cityQuery) {
  const data = locationResponse.body[0];
  const location = new Location(cityQuery, data);
  response.send(location);
  console.log(data);
  let insertSQL = `INSERT INTO locations (search_query, display_name, latitude, longitude) VALUES ($1, $2, $3, $4);`;
  let insertValues = [cityQuery, data.format_query , data.latitude, data.longitude];
  dbClient.query(insertSQL, insertValues);
  response.status(200).send(location)
}

function handleLocation(request, response) {

  let cityQuery = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json&limit=1`;

  let searchSQL = `SELECT * FROM locations WHERE search_query=$1;`;
  let searchValue = [cityQuery];

  dbClient.query(searchSQL, searchValue)
    .then(sqlResults => {
      if (sqlResults.rows[0]) {
        response.status(200).send(new Location(cityQuery, sqlResults.rows[0]))
      } else {
        superagent.get(url)
          .then(locationResponse => {
            declaredLocationResponse(locationResponse, response, cityQuery);
          })
          .catch(error => { errorHandler(error, request, response, next) });
      }
    })
    .catch(error => { errorHandler(error, request, response) });
}


app.get('/location', handleLocation);

function declaredWeatherResponse(weatherResponse, response) {
  const data = weatherResponse.body.data;
  const newWeatherArray = [];
  data.forEach(item => {
    newWeatherArray.push(new Weather(item.datetime, item.weather.description))
  });
  response.send(newWeatherArray);
}

function handleWeather(request, response) {
  const key = process.env.WEATHER_API_KEY;
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;

  superagent.get(url)
    .then(weatherResponse => {declaredWeatherResponse(weatherResponse, response)
    }).catch( error => { errorHandler(error, request, response) });
}


app.get('/weather', handleWeather);

function declaredTrailResponse(trailsResponse, response) {
  const extractedTrails = trailsResponse.body.trails;
  let localTrailArrayResult = extractedTrails.map(item => {
    return new Trail(item);
  });
  response.status(200).send(localTrailArrayResult);
}

function handleTrail(request, response) {
  const key = process.env.TRAILS_API_KEY;
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=-${longitude}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(trailsResponse => {
      declaredTrailResponse(trailsResponse, response);
    })
    .catch( error => { errorHandler(error, request, response) });
}

app.get( '/trails', handleTrail);

// function declaredMovieResponse(movieResponse, response) {

// }

// function handleMovie(request, response) {
//   const key = process.env.MOVIES_API_KEY;
//   const latitude = request.query.latitude;
//   const longitude = request.query.longitude;

//   const url = `https://api.themoviedb.org/3/movie/550?api_key=${key}`;

//   superagent.get(url)
//     .then(movieResponse => {declaredMovieResponse(movieResponse, response)
//     }).catch( error => { errorHandler(error, request, response) });
// }

// app.get( '/movies', handleMovie);

function declaredYelpResponse(yelpResponse, response) {
  console.log(yelpResponse.body.businesses);
  const results = yelpResponse.body.businesses.map(item => new Business(item));
  response.send(results);
}


function handleYelp(request, response) {
  const cityQuery = request.query.city;
  let url = `http://api.yelp.com/v3/businesses/search?location=${cityQuery}&term=restaurants`;
  superagent.get(url)
    .set({
      "Authorization": `Bearer ${process.env.YELP_API_KEY}`
    })
    .then(yelpResponse => {
      declaredYelpResponse(yelpResponse, response);
    })
    .catch((error) => {
      response.send('Something is wrong: ' + error);
    });
}

app.get( '/yelp', handleYelp);

app.get('*', (request, response) => {
  response.status(404).send('sorry something is wrong');
});

dbClient.connect(error => {
  if (error) {
    console.log('something went wrong: ' + error);
  } else {
    app.listen(PORT, () => {console.log('Application is running on PORT: ' + PORT);});
  }
});
