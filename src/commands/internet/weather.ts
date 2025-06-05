// All the types!
import type { Command } from '../../imports/types.ts'
// Get the NASA API token.
import { weatherAPIkey } from '../../config.ts'

// Our weather and define types.
interface Weather {
  cod: string
  coord: { lon: number; lat: number }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  main: { temp: number; temp_min: number; temp_max: number; humidity: number; pressure: number }
  visibility: number
  wind: { speed: number; deg: number }
  clouds: { all: number }
  rain: { '3h': number }
  snow: { '3h': number }
}
export const handleWeather: Command = {
  name: 'weather',
  aliases: ['wt'],
  opts: {
    description: "It's really cloudy here..",
    fullDescription: "What's the weather like at your place?",
    usage: '/weather <city name> (country code) (--fahrenheit or -f)',
    example: '/weather Shanghai CN',
  },
  generator: async (message, args) => {
    const fahrenheit = args.includes('--fahrenheit') || args.includes('-f')
    if (fahrenheit)
      args.splice(args.includes('-f') ? args.indexOf('-f') : args.indexOf('--fahrenheit'), 1)
    // Get the response from our API.
    const weather = (await (
      await fetch(
        `http://api.openweathermap.org/data/2.5/weather?q=${args.join(',')}` +
          `&appid=${weatherAPIkey}&units=${fahrenheit ? 'imperial' : 'metric'}`,
      )
    ).json()) as Weather
    const temp = fahrenheit ? '°F' : '°C'
    // If the place doesn't exist..
    if (weather.cod === '404') return { content: 'Enter a valid city >_<', error: true }
    // We generate the entire embed.
    return {
      content: `**🌇🌃🌁🌆 The weather for ${args.join(', ')}:**`,
      embeds: [
        {
          title: 'Weather at ' + args.join(', '),
          color: 0x6d6bea,
          description: `**Description:** ${weather.weather[0].main} - ${weather.weather[0].description}`,
          thumbnail: { url: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png` },
          footer: { text: 'Weather data from https://openweathermap.org' },
          fields: [
            {
              name: 'Co-ordinates 🗺',
              value: `${Math.abs(weather.coord.lat)}${weather.coord.lat >= 0 ? '°N' : '°S'} /\
 ${Math.abs(weather.coord.lon)}${weather.coord.lon >= 0 ? '°E' : '°W'}
**(Latitude/Longitude)**`,
              inline: true,
            },
            {
              name: 'Temperature 🌡',
              value: `
${weather.main.temp}${temp}/${weather.main.temp_max}${temp}/${weather.main.temp_min}${temp}
**(avg/max/min)**`,
              inline: true, // Description goes here
            },
            {
              name: 'Wind 🎐',
              value: `${weather.wind.speed} m/s | ${weather.wind.deg}°
**(speed | direction)**`,
              inline: true,
            },
            { name: 'Pressure 🍃', value: `${weather.main.pressure} millibars`, inline: true },
            { name: 'Humidity 💧', value: `${weather.main.humidity}%`, inline: true },
            {
              name: 'Cloud cover 🌥',
              value: weather.clouds ? `${weather.clouds.all}% of sky` : 'N/A',
              inline: true,
            },
            {
              name: 'Visibility 🌫',
              value: weather.visibility ? `${weather.visibility} meters` : 'N/A',
              inline: true,
            },
            {
              name: 'Rain, past 3h 🌧',
              value: weather.rain ? `${weather.rain['3h']}mm` : 'N/A',
              inline: true,
            },
            {
              name: 'Snow, past 3h 🌨❄',
              value: weather.snow ? `${weather.snow['3h']}mm` : 'N/A',
              inline: true,
            },
          ],
        },
      ],
    }
  },
}
