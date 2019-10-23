const xapi = require('xapi');

  // Global variables & constants
  // Note: hue goes from 0 to 65535. Both 0 and 65535 are red, 25500 is green and 46920 is blue
  // Note: sat goes from 0 to 254. 254 is the most saturated (colored) and 0 is the least saturated (white)
  const COLOR_RED = 0;
  const COLOR_GREEN = 25500;
  const COLOR_BLUE = 46920;
  const codeMessage = 'Philips Hue control by Davide Grandis, v5.0, May 2019';
  // Should be retrieved from external
  var IPAddress = '(not set)';


// Functions
function setOnOffButton(value) {
  xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'buttonOnOff', Value: value});
}

function setButtons(value) {
  if (value < 255 / 3) {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'groupButton', Value: 'red'});
  }
  else if (value < 255 / 3 * 2) {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'groupButton', Value: 'green'});
  }
  else {
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'groupButton', Value: 'blue'});
  }
}

function setSlider(value) {
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'hueSlider', Value: value/COLOR_BLUE*255});
}

function hue_command(data) {

  var token = 'ElV3RykIkEBkCw8CRYwgc83WL3GZDsXDxlHg4r8f';
  var url = 'http://' + IPAddress + '/api/' + token + '/lights/1/state';
  var header = 'Content-Type: application/json';

  xapi.command('HttpClient Put', { 'Url': url, 'Header': header}, JSON.stringify(data))
      .then((response) => {
        if (response.StatusCode == 200) {
          //console.log('Command successful');
          return;
        }
      })
    .catch((err) => {
      //console.log('Hue command failed with error: ' + err.message);
    });
}

function init() {
  console.log('Hue5 macro initializing...')
  // This needs to be set to allow HTTP Post
  xapi.config.set('HttpClient Mode', 'On');
  xapi.config.set('HttpClient AllowInsecureHTTPS', 'True');
  // Initialize the panel
  // -- Set the on/off button to off since the bridge IP address needs be to set
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'buttonOnOff', Value: 'off'});
  
  // -- set buttons to initial state (unset) and slider to zero (left)
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'hueSlider', Value: 0});
  xapi.command('UserInterface Extensions Widget UnsetValue', { WidgetId: 'groupButton'});
  // -- Branding
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'txtVersion', Value: codeMessage});
  // -- IP address of the bridge
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'txtIpAddress', Value: IPAddress});
  console.log('Hue5 macro listening...');
}


// Event listeners for widgets in the GUI
xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    //console.log(event.WidgetId, event.Type);
    if (event.WidgetId == 'buttonOnOff') {
      if (event.Value === 'on') {
        hue_command({on: true})
      }  
      if (event.Value === 'off') {
        hue_command({on: false})
      }  
    }
    if (event.WidgetId == 'hueSlider') {
      if (event.Type == 'released') {
        // Sets the button group accordingly and turn on the switch 
        setButtons(event.Value);
        // Sets the on/off button to on
        setOnOffButton('on')
        // Send the command to the bridge with the scaled hue value
        var hue = event.Value / 255 * COLOR_BLUE;
        hue_command({'on': true, 'hue': hue, 'sat': 254, 'bri': 254 });
      }
    }
    if (event.WidgetId == 'groupButton' && event.Type === 'pressed') {
      //console.log(event.Value + ' pressed');
      if (event.Value === 'red') {
        // Sets the slide to the corresponding scaled value 
        setSlider(COLOR_RED);
        // Sets the on/off button to on
        setOnOffButton('on')
        hue_command({'on': true, 'hue': COLOR_RED, 'sat': 254, 'bri': 254 });
      }
      if (event.Value === 'green') {
        // Sets the slide to the corresponding scaled value 
        setSlider(COLOR_GREEN);
        // Sets the on/off button to on
        setOnOffButton('on')
        hue_command({'on': true, 'hue': COLOR_GREEN, 'sat': 254, 'bri': 254 })
      }
      if (event.Value === 'blue') {
        // Sets the slide to the corresponding scaled value 
        setSlider(COLOR_BLUE);
        // Sets the on/off button to on
        setOnOffButton('on');
        hue_command({'on': true, 'hue': COLOR_BLUE, 'sat': 254, 'bri': 254 });
      }
    }
    if (event.WidgetId == 'btnEditIPAddress' && event.Type == 'clicked') {
      // allows the user to input the IP address
      var placeHolder;
      IPAddress == '(not set)' ? placeHolder = 'Type the address': placeHolder = IPAddress;
      xapi.command('UserInterface Message TextInput Display', {
        Text: 'IP address of the Hue bridge',
        Placeholder: placeHolder,
        InputType: 'Numeric',
        FeedbackId: 'IP_address',
        Duration: 20});  // timeout
      // Note: execution continues in the 'Feedback Response' event
    }
});

xapi.event.on('UserInterface Message TextInput Response', (event) => {
  if (event.FeedbackId == 'IP_address') {
    // reads the input
    IPAddress = event.Text
    // Validation (to-do)
    // Update the GUI
    xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'txtIpAddress', Value: IPAddress});
  }
});

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  //console.log('Clcked on panel: ' + event.PanelId)
  if (event.PanelId == 'panel_light') {
  //xapi.command('UserInterface Extensions Panel Open', {PanelId: 'panel_light', PageId: 0})
  }
});


init();