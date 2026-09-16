# A What's Up Docker for Multiple Hosts

This is a custom Lovelace card for Home Assistant that displays entities created by What's Up Docker via the Home Assistant friendly MQTT trigger. It is not designed to update the out of date containers. It is simply designed to show what containers can be updated.
## Why Another WUD Card?
I liked the existing wud-card that is already in HACS but it didn't quite work for my process. I run WUD against multiple hosts. If I'm going to go to that host and update an image then I might as well update all the out of date images on that host. I did not find a mechanism in the wud-card to do that thus this card was born.

Each host is specified in a title along with the number of updates that are available to all the monitored images running on that host and will display the container running on that host below. The section is collapsible if there are hosts you are not interested in. The images in each host are sorted into alphabetic order with either up-to-date or the current and available versions as provided by WUD.
## Installation
### HACS (recommended)
1. Open HACS in your Home Assistant - you may need to [install HACS](https://hacs.xyz/docs/use/) if you have never used it.
2. Click on the three dots in the top right and select "Custom repositories".
3. In the dialog box, paste the URL of this repository: `https://github.com/markrad/multihost-wud-card`.
4. Set the type to Dashboard.
5. Click "Add".
6. Find the "Multihost What's Up Docker Card" in the list and click "Install".
7. You will be asked to refresh the frontend. You will not be able to see the card until you do.
### Manual
*Completion reminder placeholder*
## Note on Card Update Frequency
The card will automatically update whenever new data is sent to Home Assistant by WUD. This will be driven by your CRON cards for each server. If you wish enable the refresh functionality, you must also add a REST service to your Home Assistant configuration.yaml. The card does this in order to prevent CORS (Cross-Origin Resource Sharing) errors in the event that you access your Home Assistant via TLS. Here is an example or a WUD REST service:
```yaml
# WUD REST refresh command
rest_command:
  wud_refresh:
    url: "http[s]://<Your WUD host>:<Your WUD port (typically 3000)>/api/containers/watch"
    method: POST
```

## What's Up Docker Configuration
The card expects a What's Up Docker trigger to send the latest state of the containers. This requires What's Up Docker to have an MQTT trigger that includes the necessary Home Assistant extentions. Your trigger would look something this if you are using docker compose:
```yaml
# triggers - production
      - WUD_TRIGGER_MQTT_<name>_URL=mqtt://mqtt-broker:port-number
      - WUD_TRIGGER_MQTT_<name>_CLIENTID=optional client id
      - WUD_TRIGGER_MQTT_<name>_TOPIC=wud
      - WUD_TRIGGER_MQTT_<name>_HASS_ENABLED=true
      - WUD_TRIGGER_MQTT_<name>_HASS_DISCOVERY=true
```
## License
MIT License: [MIT LICENSE](LICENSE)