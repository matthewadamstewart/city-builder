'use strict';

const express = require('express');

const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

app.get('/location', (request, response) => {
  try {
    let cityQuery = request.query.city;

    let locationData = require('./data/location.json');

    let location = new Location(locationData[0], cityQuery);

    response.send(location);
  }
  catch(err){
    response.status(500).send(err);
    console.error(err);
  }
})


app.get( '/weather', (request, response) => {
  // let city = request.query.search_query;
  // let formatted_query = request.query.formatted_query;
  // let latitude = request.query.latitude;
  // let longitude = request.query.longitude;

  let weatherData = require('./data/weather.json');
  let weatherArray = weatherData.daily.data;

  const finalWeatherArray = weatherArray.map(day => {
    return new Weather(day);
  })
  response.send(finalWeatherArray);
});


function Location (obj, city) {
  this.search_query = city;
  this.formated_query = obj.display_name;
  this.lattitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj) {
  this.time = new Date(obj.time * 1000).toDateString();
  this.forecast = obj.summary;
}


app.get('*', (request, response) => {
  response.status(404).send('sorry something is wrong');
});

app.listen(PORT, () => {console.log('Application is running on PORT: ' + PORT);
});
