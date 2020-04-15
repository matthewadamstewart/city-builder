'use strict';

const express = require('express');
const superagent = require('superagent');
const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

function declaredLocationResponse(locationResponse, response, cityQuery) {
  const data = locationResponse.body;
  for (var i in data) {
    if (data[i].display_name[0].search(cityQuery)) {
      const location = new Location(cityQuery, data[i]);
      response.send(location);
    }
  }
}

function handleLocation(request, response) {
  try {
    let cityQuery = request.query.city;
    const key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json&limit=1`;

    superagent.get(url).then(locationResponse => {declaredLocationResponse(locationResponse, response, cityQuery)});
  }
  catch(err){
    response.status(500).send(err);
    console.error(err);
  }
}

//invokes the handleLocation in when '/location' 
app.get('/location', handleLocation);

//this grabs the weatherResponse as an object from which we can extract the nested data using . syntax notation and passes response through as aparameter from the function calling it back
function declaredWeatherResponse(weatherResponse, response) {
  const data = weatherResponse.body.data;
  const newWeatherArray = [];
  data.forEach(item => {
    console.log(item);
    newWeatherArray.push(new Weather(item.datetime, item.weather.description))
  });
  response.send(newWeatherArray);
}

function handleWeather(request, response) {
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;

  superagent.get(url)
    .then(weatherResponse => {declaredWeatherResponse(weatherResponse, response)
    }).catch( (err) => {
      response.status(500).send(err);
      console.error(err);
    });
}

app.get( '/weather', handleWeather);


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


app.get('*', (request, response) => {
  response.status(404).send('sorry something is wrong');
});

app.listen(PORT, () => {console.log('Application is running on PORT: ' + PORT);})