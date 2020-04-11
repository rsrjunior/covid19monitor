import 'purecss/build/pure-min.css';
import 'purecss/build/grids-responsive-min.css';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';



class Covid19Monitor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      selected_countries: ["All"],
      available_countries: [],
      grid_class: "pure-u-1"
    }
    this.selectCountryRef = React.createRef();
    this.handleInputCountry = this.handleInputCountry.bind(this);
  }

  handleCloseCountry(country) {
    let removeCountry = this.state.selected_countries.find((x) => x === country);
    if (removeCountry) {
      let selectedCountries = this.state.selected_countries.filter((x) => x !== country);
      let gridClass = this.state.grid_class;
      if (selectedCountries.length >= 3) {
        gridClass = "pure-u-1 pure-u-md-1-2 pure-u-lg-1-3";
      } else if (selectedCountries.length === 2) {
        gridClass = "pure-u-1 pure-u-md-1-2";
      }else if(selectedCountries.length === 1){
        gridClass = "pure-u-1"
      }
      this.setState({
        selected_countries: selectedCountries,
        grid_class: gridClass
      });
    };
  }

  componentDidMount() {
    //console.log("Covid19Monitor componentDidMount. I am fetching the API for https://covid-193.p.rapidapi.com/countries");
    //fetch available countries
    fetch("https://covid-193.p.rapidapi.com/countries", {
      "method": "GET",
      "headers": {
        "x-rapidapi-host": "covid-193.p.rapidapi.com",
        "x-rapidapi-key": "c3414d2c8dmshad47f98658f598fp1b458djsn9eb932b014d0"
      }
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        let error;
        if (data.errors)
          error = data.errors[0]
        else if (!data.results)
          error = new Error("No data found");
        this.setState(
          {
            isLoaded: true,
            available_countries: data.results ? data.response : null,
            error: error
          }
        );
      })
      .catch(err => {
        this.setState(
          {
            isLoaded: true,
            error: err
          });
      });
  }

  handleInputCountry(e) {
    let sel = this.selectCountryRef.current;
    let addCountry = sel.options[sel.selectedIndex].value;

    if (addCountry
      && !this.state.selected_countries.find((x) => x === addCountry)) {

      let selectedCountries = this.state.selected_countries.slice().concat(addCountry);
      let gridClass = this.state.grid_class;
      if (selectedCountries.length >= 3) {
        gridClass = "pure-u-1 pure-u-md-1-2 pure-u-lg-1-3";
      } else if (selectedCountries.length === 2) {
        gridClass = "pure-u-1 pure-u-md-1-2";
      }
      this.setState({
        selected_countries: selectedCountries,
        grid_class: gridClass
      });
    }
  }

  render() {
    const selectedCountries = this.state.selected_countries;
    const gridClass = this.state.grid_class;
    let addCountryDiv = <div className="box box-addcountry">Loading countries...</div>;


    const countryDiv =
      selectedCountries.map((country) => {
        return <div key={country + "Div"} className={gridClass}>
          <History key={country + "History"} country={country} handleCloseCountry={(x) => this.handleCloseCountry(x)} />
        </div>;
      });

    if (this.state.isLoaded) {
      if (this.state.error) {
        addCountryDiv =
          <div className={gridClass}>
            <div className="box box-addcountry">Error while loading available countries: {this.state.error}</div>
          </div>
      } else {
        addCountryDiv =
          <div className={gridClass}>
            <div className="box box-addcountry">
              <h2>Add to Monitor</h2>
              <select ref={this.selectCountryRef} id="countrySelector">
                {this.state.available_countries.map((item, key) => <option key={key} value={item}>{item}</option>)}
              </select>
              <br />
              <button className="pure-button button-addcountry" onClick={this.handleInputCountry}>Add</button>
            </div>
          </div>
      }
    }


    return (
      <div>
        <header>Covid-19 Monitor</header>
        <div className="pure-g">
          {countryDiv}
          {addCountryDiv}
        </div>

      </div>
    );
  }
}
class History extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      stats: null,
      timestamp: null
    }
  }

  componentDidMount() {
    //console.log(`History componentDidMount. I am fetching the API for ${this.props.country}`);
    fetch(`https://covid-193.p.rapidapi.com/history?country=${this.props.country}`, {
      "method": "GET",
      "headers": {
        "x-rapidapi-host": "covid-193.p.rapidapi.com",
        "x-rapidapi-key": "c3414d2c8dmshad47f98658f598fp1b458djsn9eb932b014d0"
      }
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        let history = [];
        if (data.results) {
          history.push(data.response[0]);

          let fetchDay = new Date(data.response[0].time.substring(0, 10));

          for (let i = 1; i < 30; i++) {
            fetchDay.setDate(fetchDay.getDate() - 1);
            let newData = data.response.find(x => x.day === fetchDay.toISOString().substring(0, 10));
            if (newData)
              history.push(newData);
          }

          history.reverse();

        }
        this.setState(
          {
            isLoaded: true,
            stats: history,
            error: data.results ? null : new Error("No data found"),
            timestamp: data.results ? data.response[0].time : null
          }
        );
      })
      .catch(err => {
        this.setState(
          {
            isLoaded: true,
            error: err
          });
      });
  }

  render() {
    const { error, isLoaded, stats, timestamp } = this.state;

    if (error) {
      return <div className="box box-history">Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div className="box box-history">Loading...</div>;
    } else {
      let history = [...stats];
      let data = history.map(x => {
        return {
          name: x.day,
          total: x.cases.total,
          active: x.cases.active,
          recovered: x.cases.recovered,
          deaths: x.deaths.total,
          critical: x.cases.critical
        }
      });
      let renderLineChart = (
        // <div style={{ width: '100%', height: 300, maxWidth: 600 }}>
        <ResponsiveContainer
          minHeight={125} minWidth={250}
          aspect={2.5} width="100%">
          <LineChart data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>>
            <Line type="monotone" dataKey="total" stroke="#FF5900" />
            <Line type="monotone" dataKey="active" stroke="#A78C04" />
            <Line type="monotone" dataKey="recovered" stroke="#27A704" />
            <Line type="monotone" dataKey="deaths" stroke="#000000" />
            <Line type="monotone" dataKey="critical" stroke="#FF0000" />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={tick => {
              return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(tick)
            }} />
            <Tooltip />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      )
      return (
        <div className="box box-history">
          <div style={{ textAlign: 'end' }}>
            <button className="pure-button button-closecountry"
              onClick={(e) => this.props.handleCloseCountry(this.props.country)}>X</button>
          </div>
          <h2>{this.props.country === "All" ? "World" : this.props.country}</h2>
          {renderLineChart}
          <footer className="fetchInfo">
            Data obtained from <a href="https://rapidapi.com/api-sports/api/covid-193">api-sports</a> at {new Date(timestamp).toUTCString()}
          </footer>
        </div>
      )
    }
  }
}

ReactDOM.render(
  <React.StrictMode>
    <Covid19Monitor />
    {/* <CheckboxesTags /> */}
  </React.StrictMode>,
  document.getElementById('root')
);
