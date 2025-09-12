import { Country, State, City } from 'country-state-city'
import httpStatus from 'http-status'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'

export const getCountriesController = async (req, res) => {
  try {
    const countries = Country.getAllCountries()
    
    const formattedCountries = countries.map(country => ({
      name: country.name,
      code: country.isoCode,
      flag: country.flag,
      phonecode: country.phonecode,
      currency: country.currency,
      latitude: country.latitude,
      longitude: country.longitude
    }))

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        countries: formattedCountries,
        count: formattedCountries.length
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

export const getStatesByCountryController = async (req, res) => {
  try {
    const { countryCode } = req.params
    const states = State.getStatesOfCountry(countryCode)
    
    const formattedStates = states.map(state => ({
      name: state.name,
      code: state.isoCode,
      countryCode: state.countryCode,
      latitude: state.latitude,
      longitude: state.longitude
    }))

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        states: formattedStates,
        count: formattedStates.length,
        countryCode
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

export const getCitiesByStateController = async (req, res) => {
  try {
    const { countryCode, stateCode } = req.params
    const cities = City.getCitiesOfState(countryCode, stateCode)
    
    const formattedCities = cities.map(city => ({
      name: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      latitude: city.latitude,
      longitude: city.longitude
    }))

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        cities: formattedCities,
        count: formattedCities.length,
        countryCode,
        stateCode
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}