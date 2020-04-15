'use strict';

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

function Location (city, data) {
  this.search_query = city;
  this.formated_query = data.display_name;
  this.lattitude =data.lat;
  this.longitude = data.lon;
}

function Weather(date, forecast) {
  this.forecast = forecast;
  this.time = new Date(date).toDateString;
}


function handleWeather(request, response) {
  const weatherData =require('./data/weather.json');
  const weatherArray = [];
  
  weatherData.forEach(object => {
    let newForcast = new Weather(object.datetime, object.weather.description);
    weatherArray.push(newForecast);
  });
  response.send(weatherArray);
}

function handleLocation(request, response) {
  const cityQuery = request.query.city;

  const locationData = require('./data/location.json');
  location = new Location(cityQuery, locationData[0])

  console.log(cityQuery, locationData);
  const latitude = locationData[0].lat;
  const logitude  = locationData[0].lon;
  response.send(location);
}


app.use(cors());
app.get('/location', handleLocation);
app.get('/weather', handleWeather);

app.listen(PORT, () => {console.log('Application is running on PORT:' + PORT);
});
